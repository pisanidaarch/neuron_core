// src/cross/entity/permission.js

/**
 * Permission Entity - Represents a user permission in the system
 * Used as DTO between layers
 */
class Permission {
    constructor(data = {}) {
        this.email = data.email || null;
        this.database = data.database || null;
        this.namespace = data.namespace || null;
        this.entity = data.entity || null;
        this.level = data.level || 1; // 1=read, 2=write, 3=admin
        this.grantedBy = data.grantedBy || null;
        this.expiresAt = data.expiresAt || null;
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Validate permission entity
     * @returns {string[]} Array of validation errors
     */
    validate() {
        const errors = [];

        if (!this.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        if (!this.database) {
            errors.push('Database is required');
        } else if (typeof this.database !== 'string') {
            errors.push('Database must be a string');
        }

        // Namespace and entity are optional (can be null for database-level permissions)
        if (this.namespace !== null && typeof this.namespace !== 'string') {
            errors.push('Namespace must be a string or null');
        }

        if (this.entity !== null && typeof this.entity !== 'string') {
            errors.push('Entity must be a string or null');
        }

        if (!Number.isInteger(this.level) || this.level < 1 || this.level > 3) {
            errors.push('Level must be 1 (read), 2 (write), or 3 (admin)');
        }

        if (this.expiresAt !== null && !this.isValidDate(this.expiresAt)) {
            errors.push('ExpiresAt must be a valid ISO date string or null');
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
     * Check if date is valid ISO string
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Get permission scope
     * @returns {string} Scope identifier
     */
    getScope() {
        const parts = [this.database];
        if (this.namespace) parts.push(this.namespace);
        if (this.entity) parts.push(this.entity);
        return parts.join('.');
    }

    /**
     * Check if permission is expired
     */
    isExpired() {
        if (!this.expiresAt) return false;
        return new Date(this.expiresAt) < new Date();
    }

    /**
     * Check if permission is active
     */
    isActive() {
        return !this.isExpired();
    }

    /**
     * Check if permission allows operation
     * @param {string} operation - Operation to check (read, write, admin)
     * @returns {boolean}
     */
    allowsOperation(operation) {
        if (this.isExpired()) return false;

        switch (operation.toLowerCase()) {
            case 'read':
                return this.level >= 1;
            case 'write':
                return this.level >= 2;
            case 'admin':
                return this.level >= 3;
            default:
                return false;
        }
    }

    /**
     * Check if permission has read access
     */
    canRead() {
        return this.allowsOperation('read');
    }

    /**
     * Check if permission has write access
     */
    canWrite() {
        return this.allowsOperation('write');
    }

    /**
     * Check if permission has admin access
     */
    canAdmin() {
        return this.allowsOperation('admin');
    }

    /**
     * Get permission level name
     */
    getLevelName() {
        switch (this.level) {
            case 1: return 'read';
            case 2: return 'write';
            case 3: return 'admin';
            default: return 'unknown';
        }
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            email: this.email,
            database: this.database,
            namespace: this.namespace,
            entity: this.entity,
            level: this.level,
            grantedBy: this.grantedBy,
            expiresAt: this.expiresAt,
            metadata: { ...this.metadata },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert to safe JSON (for display)
     */
    toSafeJSON() {
        return {
            ...this.toJSON(),
            levelName: this.getLevelName(),
            scope: this.getScope(),
            active: this.isActive()
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        return new Permission(data);
    }

    /**
     * Clone permission
     */
    clone() {
        return new Permission(this.toJSON());
    }

    /**
     * Update permission data
     */
    update(data) {
        if (data.email !== undefined) this.email = data.email;
        if (data.database !== undefined) this.database = data.database;
        if (data.namespace !== undefined) this.namespace = data.namespace;
        if (data.entity !== undefined) this.entity = data.entity;
        if (data.level !== undefined) this.level = data.level;
        if (data.grantedBy !== undefined) this.grantedBy = data.grantedBy;
        if (data.expiresAt !== undefined) this.expiresAt = data.expiresAt;
        if (data.metadata !== undefined) this.metadata = { ...data.metadata };
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Check equality
     */
    equals(other) {
        if (!(other instanceof Permission)) return false;
        return this.email === other.email &&
               this.database === other.database &&
               this.namespace === other.namespace &&
               this.entity === other.entity;
    }

    /**
     * Create permission identifier
     */
    getId() {
        return `${this.email}:${this.getScope()}`;
    }

    /**
     * Permission level constants
     */
    static LEVELS = {
        READ: 1,
        WRITE: 2,
        ADMIN: 3
    };
}

module.exports = Permission;