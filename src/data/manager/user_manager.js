// src/data/manager/user_manager.js

const bcrypt = require('bcrypt');
const { getInstance } = require('./keys_vo_manager');
const NeuronDBSender = require('../neuron_db/sender');
const UserSNL = require('../snl/user_snl');
const User = require('../../cross/entity/user');
const { AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * UserManager - Manages user operations via NeuronDB
 */
class UserManager {
    constructor() {
        this.sender = new NeuronDBSender();
        this.snl = new UserSNL();
    }

    /**
     * Initialize manager with config credentials
     * @private
     */
    async _initialize() {
        const keysManager = getInstance();
        const keysVO = keysManager.getKeysVO();

        if (!keysVO) {
            throw new AuthenticationError('KeysVO not initialized');
        }

        const configUrl = keysVO.getConfigUrl();
        const configToken = keysVO.getConfigToken();

        if (!configUrl || !configToken) {
            throw new AuthenticationError('Config database credentials not found');
        }

        this.sender.initialize(configUrl, configToken);
    }

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Promise<User>}
     */
    async createUser(userData) {
        try {
            await this._initialize();

            // Validate required fields
            this._validateUserData(userData);

            // Check if user already exists
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new ValidationError('User already exists', 'email');
            }

            // Hash password
            const hashedPassword = await this._hashPassword(userData.password);

            // Create user entity
            const user = new User({
                email: userData.email,
                password: hashedPassword,
                nick: userData.nick,
                group: userData.group || 'default',
                level: userData.level || 1,
                active: userData.active !== false
            });

            // Generate SNL command
            const snlCommand = this.snl.createUserSNL(user);

            // Execute SNL command
            await this.sender.executeSNL(snlCommand);

            // Return user without password
            user.password = undefined;
            return user;

        } catch (error) {
            throw new AuthenticationError(`Failed to create user: ${error.message}`);
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>}
     */
    async getUserByEmail(email) {
        try {
            await this._initialize();

            const snlCommand = this.snl.getUserSNL(email);
            const response = await this.sender.executeSNL(snlCommand);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const userData = this.snl.parseUserData(response);
            return User.fromObject(userData);

        } catch (error) {
            // Return null if user not found, throw for other errors
            if (error.message.includes('not found')) {
                return null;
            }
            throw new AuthenticationError(`Failed to get user: ${error.message}`);
        }
    }

    /**
     * Get user by ID (alias for email)
     * @param {string} email - User email (used as ID)
     * @returns {Promise<User|null>}
     */
    async getUser(email) {
        return this.getUserByEmail(email);
    }

    /**
     * Update user
     * @param {string} email - User email
     * @param {Object} updateData - Update data
     * @returns {Promise<User>}
     */
    async updateUser(email, updateData) {
        try {
            await this._initialize();

            // Get existing user
            const existingUser = await this.getUserByEmail(email);
            if (!existingUser) {
                throw new ValidationError('User not found', 'email');
            }

            // Hash password if provided
            if (updateData.password) {
                updateData.password = await this._hashPassword(updateData.password);
            }

            // Update user entity
            const updatedUser = { ...existingUser, ...updateData };
            const user = User.fromObject(updatedUser);

            // Generate SNL command
            const snlCommand = this.snl.updateUserSNL(user);

            // Execute SNL command
            await this.sender.executeSNL(snlCommand);

            // Return updated user without password
            user.password = undefined;
            return user;

        } catch (error) {
            throw new AuthenticationError(`Failed to update user: ${error.message}`);
        }
    }

    /**
     * Delete user
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    async deleteUser(email) {
        try {
            await this._initialize();

            // Check if user exists
            const existingUser = await this.getUserByEmail(email);
            if (!existingUser) {
                throw new ValidationError('User not found', 'email');
            }

            // Generate SNL command
            const snlCommand = this.snl.deleteUserSNL(email);

            // Execute SNL command
            await this.sender.executeSNL(snlCommand);

            return true;

        } catch (error) {
            throw new AuthenticationError(`Failed to delete user: ${error.message}`);
        }
    }

    /**
     * List users
     * @param {Object} options - List options
     * @returns {Promise<Array<User>>}
     */
    async listUsers(options = {}) {
        try {
            await this._initialize();

            const { pattern = '*', limit = 50 } = options;

            const snlCommand = this.snl.listUsersSNL(pattern);
            const response = await this.sender.executeSNL(snlCommand);

            const userEmails = this.snl.parseUsersList(response);
            const users = [];

            for (const email of userEmails.slice(0, limit)) {
                const user = await this.getUserByEmail(email);
                if (user) {
                    user.password = undefined; // Remove password from list
                    users.push(user);
                }
            }

            return users;

        } catch (error) {
            throw new AuthenticationError(`Failed to list users: ${error.message}`);
        }
    }

    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<User>}
     */
    async authenticateUser(email, password) {
        try {
            await this._initialize();

            const user = await this.getUserByEmail(email);
            if (!user) {
                throw new AuthenticationError('Invalid credentials');
            }

            if (!user.active) {
                throw new AuthenticationError('User account is disabled');
            }

            const isPasswordValid = await this._verifyPassword(password, user.password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Invalid credentials');
            }

            // Update last login
            await this.updateUser(email, { lastLogin: new Date().toISOString() });

            // Return user without password
            user.password = undefined;
            return user;

        } catch (error) {
            throw new AuthenticationError(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Change user password
     * @param {string} email - User email
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>}
     */
    async changePassword(email, currentPassword, newPassword) {
        try {
            // Authenticate with current password
            await this.authenticateUser(email, currentPassword);

            // Hash new password
            const hashedPassword = await this._hashPassword(newPassword);

            // Update user
            await this.updateUser(email, { password: hashedPassword });

            return true;

        } catch (error) {
            throw new AuthenticationError(`Failed to change password: ${error.message}`);
        }
    }

    /**
     * Validate user data
     * @param {Object} userData - User data to validate
     * @private
     */
    _validateUserData(userData) {
        if (!userData.email) {
            throw new ValidationError('Email is required', 'email');
        }

        if (!userData.password) {
            throw new ValidationError('Password is required', 'password');
        }

        if (!userData.nick) {
            throw new ValidationError('Nick is required', 'nick');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new ValidationError('Invalid email format', 'email');
        }

        // Validate password strength
        if (userData.password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters', 'password');
        }
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     * @private
     */
    async _hashPassword(password) {
        const keysManager = getInstance();
        const keysVO = keysManager.getKeysVO();
        const rounds = 12; // Could be configurable

        return await bcrypt.hash(password, rounds);
    }

    /**
     * Verify password using bcrypt
     * @param {string} password - Plain text password
     * @param {string} hashedPassword - Hashed password
     * @returns {Promise<boolean>} True if password matches
     * @private
     */
    async _verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

// Export singleton instance
module.exports = new UserManager();