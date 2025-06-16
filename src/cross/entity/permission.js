// src/cross/entity/permission.js

/**
 * Permission entity for NeuronCore security module
 */
class Permission {
    constructor(data = {}) {
        this.user_email = data.user_email || '';
        this.database = data.database || '';
        this.level = data.level || 1; // 1=read, 2=write, 3=admin
        this.granted_by = data.granted_by || '';
        this.granted_at = data.granted_at || new Date().toISOString();
        this.expires_at = data.expires_at || null; // Optional expiration
    }

    /**
     * Permission levels enumeration
     */
    static LEVELS = {
        READ: 1,
        WRITE: 2,
        ADMIN: 3
    };

    /**
     * Permission level names
     */
    static LEVEL_NAMES = {
        1: 'read',
        2: 'write',
        3: 'admin'
    };

    /**
     * Create permission from NeuronDB response
     * @param {string} userEmail - User email
     * @param {string} database - Database name
     * @param {Object} data - Permission data
     * @returns {Permission}
     */
    static fromNeuronDB(userEmail, database, data) {
        return new Permission({
            user_email: userEmail,
            database: database,
            level: data.level || data,
            granted_by: data.granted_by || '',
            granted_at: data.granted_at || new Date().toISOString(),
            expires_at: data.expires_at || null
        });
    }

    /**
     * Convert to NeuronDB format
     * @returns {Object}
     */
    toNeuronDB() {
        const data = {
            level: this.level,
            granted_by: this.granted_by,
            granted_at: this.granted_at
        };

        if (this.expires_at) {
            data.expires_at = this.expires_at;
        }

        return data;
    }

    /**
     * Validate permission data
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.user_email || !this.user_email.includes('@')) {
            errors.push('Valid user email is required');
        }

        if (!this.database) {
            errors.push('Database name is required');
        }

        if (!Object.values(Permission.LEVELS).includes(this.level)) {
            errors.push('Permission level must be 1 (read), 2 (write), or 3 (admin)');
        }

        if (this.expires_at) {
            const expiresAt = new Date(this.expires_at);
            const now = new Date();
            if (expiresAt <= now) {
                errors.push('Expiration date must be in the future');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if permission is expired
     * @returns {boolean}
     */
    isExpired() {
        if (!this.expires_at) return false;

        const expiresAt = new Date(this.expires_at);
        const now = new Date();
        return now >= expiresAt;
    }

    /**
     * Check if permission is active (not expired)
     * @returns {boolean}
     */
    isActive() {
        return !this.isExpired();
    }

    /**
     * Check if permission allows specific level
     * @param {number} requiredLevel - Required permission level
     * @returns {boolean}
     */
    allows(requiredLevel) {
        return this.isActive() && this.level >= requiredLevel;
    }

    /**
     * Check if permission allows read access
     * @returns {boolean}
     */
    allowsRead() {
        return this.allows(Permission.LEVELS.READ);
    }

    /**
     * Check if permission allows write access
     * @returns {boolean}
     */
    allowsWrite() {
        return this.allows(Permission.LEVELS.WRITE);
    }

    /**
     * Check if permission allows admin access
     * @returns {boolean}
     */
    allowsAdmin() {
        return this.allows(Permission.LEVELS.ADMIN);
    }

    /**
     * Get permission level name
     * @returns {string}
     */
    getLevelName() {
        return Permission.LEVEL_NAMES[this.level] || 'unknown';
    }

    /**
     * Update permission level
     * @param {number} newLevel - New permission level
     * @param {string} grantedBy - Who granted the permission
     */
    updateLevel(newLevel, grantedBy) {
        this.level = newLevel;
        this.granted_by = grantedBy;
        this.granted_at = new Date().toISOString();
    }

    /**
     * Set expiration date
     * @param {Date} expiresAt - Expiration date
     */
    setExpiration(expiresAt) {
        this.expires_at = expiresAt ? expiresAt.toISOString() : null;
    }

    /**
     * Remove expiration (make permanent)
     */
    removePermanent() {
        this.expires_at = null;
    }

    /**
     * Create permission with specific level
     * @param {string} userEmail - User email
     * @param {string} database - Database name
     * @param {number} level - Permission level
     * @param {string} grantedBy - Who granted the permission
     * @returns {Permission}
     */
    static create(userEmail, database, level, grantedBy) {
        return new Permission({
            user_email: userEmail,
            database: database,
            level: level,
            granted_by: grantedBy,
            granted_at: new Date().toISOString()
        });
    }

    /**
     * Create read permission
     * @param {string} userEmail - User email
     * @param {string} database - Database name
     * @param {string} grantedBy - Who granted the permission
     * @returns {Permission}
     */
    static createRead(userEmail, database, grantedBy) {
        return Permission.create(userEmail, database, Permission.LEVELS.READ, grantedBy);
    }

    /**
     * Create write permission
     * @param {string} userEmail - User email
     * @param {string} database - Database name
     * @param {string} grantedBy - Who granted the permission
     * @returns {Permission}
     */
    static createWrite(userEmail, database, grantedBy) {
        return Permission.create(userEmail, database, Permission.LEVELS.WRITE, grantedBy);
    }

    /**
     * Create admin permission
     * @param {string} userEmail - User email
     * @param {string} database - Database name
     * @param {string} grantedBy - Who granted the permission
     * @returns {Permission}
     */
    static createAdmin(userEmail, database, grantedBy) {
        return Permission.create(userEmail, database, Permission.LEVELS.ADMIN, grantedBy);
    }
}

module.exports = Permission;