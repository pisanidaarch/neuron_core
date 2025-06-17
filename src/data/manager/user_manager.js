// src/data/manager/user_manager.js

const BaseManager = require('./base_manager');
const UserSNL = require('../snl/user_snl');
const User = require('../../cross/entity/user');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * User Manager - Manages user operations
 * Implements the flow: entity => manager => snl => sender => manager => entity
 */
class UserManager extends BaseManager {
    constructor() {
        super();
        this.snl = new UserSNL();
    }

    /**
     * Create user
     * @param {User} userEntity - User entity to create
     * @param {string} token - Authentication token
     * @returns {User} Created user entity
     */
    async createUser(userEntity, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(userEntity);

            // Transform entity for storage
            const userData = this.transformForStorage(userEntity);

            // Generate SNL command
            const snlCommand = this.snl.setUserSNL(userEntity.email, userData);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('createUser', { email: userEntity.email });

            // Transform response back to entity
            return this.transformToEntity({
                email: userEntity.email,
                ...userData,
                createdAt: new Date().toISOString()
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @param {string} token - Authentication token
     * @returns {User} User entity
     */
    async getUser(email, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.getUserSNL(email);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            if (!response || Object.keys(response).length === 0) {
                throw new NotFoundError(`User not found: ${email}`);
            }

            // Parse response
            const userData = this.snl.parseUser(response);

            // Transform to entity
            return this.transformToEntity(userData);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update user
     * @param {User} userEntity - User entity with updates
     * @param {string} token - Authentication token
     * @returns {User} Updated user entity
     */
    async updateUser(userEntity, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(userEntity);

            // Get existing user to merge data
            const existingUser = await this.getUser(userEntity.email, token);

            // Merge with existing data
            const updatedData = {
                ...existingUser.toJSON(),
                ...this.transformForStorage(userEntity),
                updatedAt: new Date().toISOString()
            };

            // Generate SNL command
            const snlCommand = this.snl.setUserSNL(userEntity.email, updatedData);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('updateUser', { email: userEntity.email });

            // Return updated entity
            return this.transformToEntity({
                email: userEntity.email,
                ...updatedData
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * List users
     * @param {string} pattern - Search pattern (default: '*')
     * @param {string} token - Authentication token
     * @returns {User[]} Array of user entities
     */
    async listUsers(pattern = '*', token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.listUsersSNL(pattern);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            const userList = this.snl.parseUserList(response);

            // Transform each to entity
            return userList.map(userData => this.transformToEntity(userData));

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Search users
     * @param {string} searchTerm - Search term
     * @param {string} token - Authentication token
     * @returns {User[]} Array of matching user entities
     */
    async searchUsers(searchTerm, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.searchUsersSNL(searchTerm);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            const userList = this.snl.parseUserList(response);

            // Transform each to entity
            return userList.map(userData => this.transformToEntity(userData));

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete user
     * @param {string} email - User email
     * @param {string} token - Authentication token
     */
    async deleteUser(email, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.removeUserSNL(email);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('deleteUser', { email });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate user entity
     * @param {User} entity - User entity to validate
     */
    validateEntity(entity) {
        if (!entity || !(entity instanceof User)) {
            throw new ValidationError('Invalid user entity');
        }

        const errors = entity.validate();
        if (errors.length > 0) {
            throw new ValidationError(`User validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Transform user entity for storage
     * @param {User} entity - User entity
     * @returns {Object} Data for storage
     */
    transformForStorage(entity) {
        const data = entity.toJSON();

        // Remove email from data (it's used as key)
        delete data.email;

        // Ensure required fields
        return {
            nick: data.nick,
            password: data.password,
            group: data.group || 'default',
            active: data.active !== false,
            permissions: data.permissions || [],
            metadata: data.metadata || {}
        };
    }

    /**
     * Transform response data to user entity
     * @param {Object} data - Response data
     * @returns {User} User entity
     */
    transformToEntity(data) {
        return new User({
            email: data.email,
            nick: data.nick,
            password: data.password,
            group: data.group,
            active: data.active,
            permissions: data.permissions || [],
            metadata: data.metadata || {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    /**
     * Check if user exists
     * @param {string} email - User email
     * @param {string} token - Authentication token
     * @returns {boolean} True if user exists
     */
    async userExists(email, token) {
        try {
            await this.getUser(email, token);
            return true;
        } catch (error) {
            if (error instanceof NotFoundError) {
                return false;
            }
            throw error;
        }
    }
}

module.exports = UserManager;