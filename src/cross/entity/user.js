// src/cross/entity/user.js

/**
 * User entity for NeuronCore security module
 */
class User {
    constructor(data = {}) {
        this.email = data.email || '';
        this.password = data.password || '';
        this.nick = data.nick || '';
        this.roles = data.roles || { permissions: {} };
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.active = data.active !== undefined ? data.active : true;
    }

    /**
     * Create user from NeuronDB response
     * @param {Object} data - User data from NeuronDB
     * @returns {User}
     */
    static fromNeuronDB(data) {
        return new User({
            email: data.email,
            nick: data.nick,
            roles: data.roles || { permissions: {} },
            created_at: data.created_at,
            updated_at: data.updated_at,
            active: data.active
        });
    }

    /**
     * Convert to NeuronDB format
     * @returns {Object}
     */
    toNeuronDB() {
        const data = {
            email: this.email,
            nick: this.nick,
            roles: this.roles,
            created_at: this.created_at,
            updated_at: this.updated_at,
            active: this.active
        };

        // Include password only if it's set (for creation/update)
        if (this.password) {
            data.password = this.password;
        }

        return data;
    }

    /**
     * Validate user data
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.email || !this.email.includes('@')) {
            errors.push('Valid email is required');
        }

        if (!this.nick || this.nick.length < 2) {
            errors.push('Nick must be at least 2 characters');
        }

        if (this.password && this.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if user has specific permission level on database
     * @param {string} database - Database name
     * @param {number} requiredLevel - Required permission level (1-3)
     * @returns {boolean}
     */
    hasPermission(database, requiredLevel) {
        const permissions = this.roles?.permissions || {};
        const userLevel = permissions[database] || 0;
        return userLevel >= requiredLevel;
    }

    /**
     * Add permission to user
     * @param {string} database - Database name
     * @param {number} level - Permission level (1-3)
     */
    addPermission(database, level) {
        if (!this.roles) {
            this.roles = { permissions: {} };
        }
        if (!this.roles.permissions) {
            this.roles.permissions = {};
        }
        this.roles.permissions[database] = level;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Remove permission from user
     * @param {string} database - Database name
     */
    removePermission(database) {
        if (this.roles?.permissions) {
            delete this.roles.permissions[database];
            this.updated_at = new Date().toISOString();
        }
    }

    /**
     * Get user permissions
     * @returns {Object} Permissions object
     */
    getPermissions() {
        return this.roles?.permissions || {};
    }

    /**
     * Set user as inactive
     */
    deactivate() {
        this.active = false;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Set user as active
     */
    activate() {
        this.active = true;
        this.updated_at = new Date().toISOString();
    }
}

module.exports = User;