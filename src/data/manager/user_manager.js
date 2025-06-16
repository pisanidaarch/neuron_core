// src/data/manager/user_manager.js

const User = require('../../cross/entity/user');
const UserSNL = require('../snl/user_snl');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * UserManager - Manages User entity operations
 */
class UserManager {
    constructor(aiKey) {
        this.aiKey = aiKey;
        this.userSNL = new UserSNL();
        this.sender = new NeuronDBSender();
    }

    /**
     * Initialize users structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.userSNL.checkUsersStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiKey);

            const exists = this.userSNL.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.userSNL.createUsersStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiKey);
            }
        } catch (error) {
            console.error('Failed to initialize users structure:', error);
            throw error;
        }
    }

    /**
     * Create or update user
     * @param {User} user - User entity
     * @returns {Promise<User>}
     */
    async saveUser(user) {
        try {
            const validation = user.validate();
            if (!validation.valid) {
                throw new Error(`User validation failed: ${validation.errors.join(', ')}`);
            }

            const userData = this.userSNL.buildUserData(user);
            const command = this.userSNL.setUserSNL(user.email, userData);
            await this.sender.executeSNL(command, this.aiKey);

            return user;
        } catch (error) {
            console.error('Failed to save user:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>}
     */
    async getUser(email) {
        try {
            const command = this.userSNL.getUserSNL(email);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const userData = this.userSNL.parseUserResponse(response);
            if (!userData) {
                return null;
            }

            return User.fromNeuronDB(userData);
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }

    /**
     * Get all users
     * @returns {Promise<User[]>}
     */
    async getAllUsers() {
        try {
            const command = this.userSNL.getAllUsersSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            const usersData = this.userSNL.parseAllUsersResponse(response);
            const users = [];

            for (const [email, userData] of Object.entries(usersData)) {
                const user = User.fromNeuronDB({ email, ...userData });
                users.push(user);
            }

            return users;
        } catch (error) {
            console.error('Failed to get all users:', error);
            return [];
        }
    }

    /**
     * Get list of user emails
     * @returns {Promise<string[]>}
     */
    async getUserList() {
        try {
            const command = this.userSNL.getListUsersSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.userSNL.parseUsersListResponse(response);
        } catch (error) {
            console.error('Failed to get user list:', error);
            return [];
        }
    }

    /**
     * Search users
     * @param {string} searchTerm - Search term
     * @returns {Promise<User[]>}
     */
    async searchUsers(searchTerm) {
        try {
            const command = this.userSNL.searchUsersSNL(searchTerm);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const searchResults = this.userSNL.parseSearchResponse(response);
            const users = [];

            for (const userData of searchResults) {
                const user = User.fromNeuronDB(userData);
                users.push(user);
            }

            return users;
        } catch (error) {
            console.error('Failed to search users:', error);
            return [];
        }
    }

    /**
     * Remove user
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    async removeUser(email) {
        try {
            const command = this.userSNL.removeUserSNL(email);
            await this.sender.executeSNL(command, this.aiKey);
            return true;
        } catch (error) {
            console.error('Failed to remove user:', error);
            return false;
        }
    }

    /**
     * Check if user exists
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    async userExists(email) {
        const user = await this.getUser(email);
        return user !== null;
    }

    /**
     * Create user with default permissions
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} nick - User nickname
     * @param {Object} permissions - Initial permissions
     * @returns {Promise<User>}
     */
    async createUser(email, password, nick, permissions = {}) {
        try {
            const user = new User({
                email,
                password,
                nick,
                roles: {
                    permissions: permissions
                }
            });

            return await this.saveUser(user);
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    /**
     * Update user permissions
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {number} level - Permission level
     * @returns {Promise<boolean>}
     */
    async updateUserPermission(email, database, level) {
        try {
            const user = await this.getUser(email);
            if (!user) {
                throw new Error('User not found');
            }

            user.addPermission(database, level);
            await this.saveUser(user);
            return true;
        } catch (error) {
            console.error('Failed to update user permission:', error);
            return false;
        }
    }

    /**
     * Remove user permission
     * @param {string} email - User email
     * @param {string} database - Database name
     * @returns {Promise<boolean>}
     */
    async removeUserPermission(email, database) {
        try {
            const user = await this.getUser(email);
            if (!user) {
                throw new Error('User not found');
            }

            user.removePermission(database);
            await this.saveUser(user);
            return true;
        } catch (error) {
            console.error('Failed to remove user permission:', error);
            return false;
        }
    }

    /**
     * Activate user
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    async activateUser(email) {
        try {
            const user = await this.getUser(email);
            if (!user) {
                throw new Error('User not found');
            }

            user.activate();
            await this.saveUser(user);
            return true;
        } catch (error) {
            console.error('Failed to activate user:', error);
            return false;
        }
    }

    /**
     * Deactivate user
     * @param {string} email - User email
     * @returns {Promise<boolean>}
     */
    async deactivateUser(email) {
        try {
            const user = await this.getUser(email);
            if (!user) {
                throw new Error('User not found');
            }

            user.deactivate();
            await this.saveUser(user);
            return true;
        } catch (error) {
            console.error('Failed to deactivate user:', error);
            return false;
        }
    }

    /**
     * Get active users only
     * @returns {Promise<User[]>}
     */
    async getActiveUsers() {
        const allUsers = await this.getAllUsers();
        return allUsers.filter(user => user.active);
    }

    /**
     * Create subscription admin user if not exists
     * @returns {Promise<User|null>}
     */
    async createSubscriptionAdminUser() {
        try {
            const adminEmail = 'subscription_admin@system.local';
            const existingUser = await this.getUser(adminEmail);

            if (existingUser) {
                return existingUser;
            }

            const adminUser = new User({
                email: adminEmail,
                password: 'sudo_subscription_admin',
                nick: 'Subscription Admin',
                roles: {
                    permissions: {
                        main: 3, // Admin level
                        timeline: 3,
                        'user-data': 3,
                        workflow: 3,
                        'workflow-hist': 3
                    }
                }
            });

            return await this.saveUser(adminUser);
        } catch (error) {
            console.error('Failed to create subscription admin user:', error);
            return null;
        }
    }
}

module.exports = UserManager;