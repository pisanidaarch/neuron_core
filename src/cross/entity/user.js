// src/cross/entity/user.js

/**
 * User Entity - Represents a user in the system
 * Used as DTO between layers
 */
class User {
    constructor(data = {}) {
        this.email = data.email || null;
        this.nick = data.nick || null;
        this.password = data.password || null;
        this.group = data.group || 'default';
        this.active = data.active !== false;
        this.permissions = data.permissions || [];
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Validate user entity
     * @returns {string[]} Array of validation errors
     */
    validate() {
        const errors = [];

        if (!this.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        if (!this.nick) {
            errors.push('Nick is required');
        } else if (this.nick.length < 2) {
            errors.push('Nick must be at least 2 characters');
        }

        if (!this.password) {
            errors.push('Password is required');
        } else if (this.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        if (!this.group) {
            errors.push('Group is required');
        }

        if (!Array.isArray(this.permissions)) {
            errors.push('Permissions must be an array');
        }

        return errors;
    }

    /**
     * Check if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    /**
     * Check if user is in group
     */
    isInGroup(group) {
        return this.group === group;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.group === 'admin' || this.group === 'subscription_admin';
    }

    /**
     * Check if user is active
     */
    isActive() {
        return this.active === true;
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            email: this.email,
            nick: this.nick,
            password: this.password,
            group: this.group,
            active: this.active,
            permissions: this.permissions,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert to safe JSON (without password)
     */
    toSafeJSON() {
        const data = this.toJSON();
        delete data.password;
        return data;
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        return new User(data);
    }

    /**
     * Clone user
     */
    clone() {
        return new User(this.toJSON());
    }

    /**
     * Update user data
     */
    update(data) {
        if (data.email !== undefined) this.email = data.email;
        if (data.nick !== undefined) this.nick = data.nick;
        if (data.password !== undefined) this.password = data.password;
        if (data.group !== undefined) this.group = data.group;
        if (data.active !== undefined) this.active = data.active;
        if (data.permissions !== undefined) this.permissions = data.permissions;
        if (data.metadata !== undefined) this.metadata = data.metadata;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Check equality
     */
    equals(other) {
        if (!(other instanceof User)) return false;
        return this.email === other.email;
    }

    /**
     * Get display name
     */
    getDisplayName() {
        return this.nick || this.email;
    }
}

module.exports = User;