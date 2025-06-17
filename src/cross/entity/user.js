// src/cross/entity/user.js

/**
 * User entity representing a system user
 */
class User {
    constructor(data = {}) {
        this.email = data.email || null;
        this.password = data.password || null;
        this.nick = data.nick || null;
        this.group = data.group || 'default';
        this.level = data.level || 1;
        this.active = data.active !== false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
    }

    /**
     * Create User from object
     * @param {Object} data - User data
     * @returns {User}
     */
    static fromObject(data) {
        return new User(data);
    }

    /**
     * Convert to object (for serialization)
     * @returns {Object}
     */
    toObject() {
        return {
            email: this.email,
            nick: this.nick,
            group: this.group,
            level: this.level,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLogin: this.lastLogin
        };
    }

    /**
     * Validate user data
     * @returns {Array<string>} Validation errors
     */
    validate() {
        const errors = [];

        if (!this.email) {
            errors.push('Email is required');
        }

        if (!this.nick) {
            errors.push('Nick is required');
        }

        if (this.level < 1 || this.level > 3) {
            errors.push('Level must be between 1 and 3');
        }

        return errors;
    }
}

module.exports = User;

// ===================================

// src/cross/entity/group.js

/**
 * Group entity representing a user group
 */
class Group {
    constructor(data = {}) {
        this.name = data.name || null;
        this.description = data.description || null;
        this.level = data.level || 1;
        this.active = data.active !== false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Create Group from object
     * @param {Object} data - Group data
     * @returns {Group}
     */
    static fromObject(data) {
        return new Group(data);
    }

    /**
     * Convert to object (for serialization)
     * @returns {Object}
     */
    toObject() {
        return {
            name: this.name,
            description: this.description,
            level: this.level,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Validate group data
     * @returns {Array<string>} Validation errors
     */
    validate() {
        const errors = [];

        if (!this.name) {
            errors.push('Name is required');
        }

        if (this.level < 1 || this.level > 3) {
            errors.push('Level must be between 1 and 3');
        }

        return errors;
    }
}

module.exports = Group;

// ===================================

// src/data/snl/user_snl.js

/**
 * UserSNL - Generates SNL commands for user operations
 */
class UserSNL {
    /**
     * Generate SNL command to create user
     * @param {User} user - User entity
     * @returns {string} SNL command
     */
    createUserSNL(user) {
        const userData = {
            password: user.password,
            nick: user.nick,
            group: user.group,
            level: user.level,
            active: user.active,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        return `set(structure)
values("${user.email}", ${JSON.stringify(userData)})
on(main.core.users)`;
    }

    /**
     * Generate SNL command to get user
     * @param {string} email - User email
     * @returns {string} SNL command
     */
    getUserSNL(email) {
        return `view(structure)
on(main.core.users.${this._escapeEmail(email)})`;
    }

    /**
     * Generate SNL command to update user
     * @param {User} user - User entity
     * @returns {string} SNL command
     */
    updateUserSNL(user) {
        return this.createUserSNL(user); // Same as create for NeuronDB
    }

    /**
     * Generate SNL command to delete user
     * @param {string} email - User email
     * @returns {string} SNL command
     */
    deleteUserSNL(email) {
        return `remove(structure, id)
values("${email}")
on(main.core.users)`;
    }

    /**
     * Generate SNL command to list users
     * @param {string} pattern - Search pattern
     * @returns {string} SNL command
     */
    listUsersSNL(pattern = '*') {
        return `list(structure)
values("${pattern}")
on(main.core.users)`;
    }

    /**
     * Parse user data from SNL response
     * @param {Object} response - SNL response
     * @returns {Object} Parsed user data
     */
    parseUserData(response) {
        // Handle different response formats
        if (typeof response === 'object' && response !== null) {
            return response;
        }

        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch (error) {
                throw new Error('Invalid user data format');
            }
        }

        throw new Error('No user data found');
    }

    /**
     * Parse users list from SNL response
     * @param {Object} response - SNL response
     * @returns {Array<string>} Array of user emails
     */
    parseUsersList(response) {
        if (Array.isArray(response)) {
            return response;
        }

        if (typeof response === 'object' && response !== null) {
            return Object.keys(response);
        }

        return [];
    }

    /**
     * Escape email for SNL command
     * @param {string} email - Email to escape
     * @returns {string} Escaped email
     * @private
     */
    _escapeEmail(email) {
        // Replace special characters for SNL compatibility
        return email.replace(/[@.]/g, '_');
    }
}

module.exports = UserSNL;

// ===================================

// src/data/manager/group_manager.js

const Group = require('../../cross/entity/group');
const { ValidationError } = require('../../cross/entity/errors');

/**
 * GroupManager - Manages group operations (basic implementation)
 */
class GroupManager {
    /**
     * Create new group
     * @param {Object} groupData - Group data
     * @returns {Promise<Group>}
     */
    static async createGroup(groupData) {
        // TODO: Implement group creation
        const group = new Group(groupData);
        console.log(`Creating group: ${group.name}`);
        return group;
    }

    /**
     * Get group by name
     * @param {string} name - Group name
     * @returns {Promise<Group|null>}
     */
    static async getGroup(name) {
        // TODO: Implement group retrieval
        console.log(`Getting group: ${name}`);
        return null; // Return null for now
    }

    /**
     * List all groups
     * @returns {Promise<Array<Group>>}
     */
    static async listGroups() {
        // TODO: Implement group listing
        return [];
    }
}

module.exports = GroupManager;