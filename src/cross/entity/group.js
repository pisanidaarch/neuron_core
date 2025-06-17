// src/cross/entity/group.js

/**
 * Group Entity - Represents a user group in the system
 * Used as DTO between layers
 */
class Group {
    constructor(data = {}) {
        this.name = data.name || null;
        this.description = data.description || '';
        this.permissions = data.permissions || [];
        this.system = data.system || false;
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Validate group entity
     * @returns {string[]} Array of validation errors
     */
    validate() {
        const errors = [];

        if (!this.name) {
            errors.push('Group name is required');
        } else if (typeof this.name !== 'string') {
            errors.push('Group name must be a string');
        } else if (this.name.length < 2) {
            errors.push('Group name must be at least 2 characters');
        } else if (!/^[a-z0-9_]+$/.test(this.name)) {
            errors.push('Group name must contain only lowercase letters, numbers, and underscores');
        }

        if (this.description && typeof this.description !== 'string') {
            errors.push('Group description must be a string');
        }

        if (!Array.isArray(this.permissions)) {
            errors.push('Group permissions must be an array');
        } else {
            this.permissions.forEach((permission, index) => {
                if (typeof permission !== 'string') {
                    errors.push(`Permission at index ${index} must be a string`);
                }
            });
        }

        if (typeof this.system !== 'boolean') {
            errors.push('Group system flag must be a boolean');
        }

        return errors;
    }

    /**
     * Check if group has permission
     */
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    /**
     * Add permission to group
     */
    addPermission(permission) {
        if (!this.permissions.includes(permission)) {
            this.permissions.push(permission);
        }
        return this;
    }

    /**
     * Remove permission from group
     */
    removePermission(permission) {
        this.permissions = this.permissions.filter(p => p !== permission);
        return this;
    }

    /**
     * Check if group is system group
     */
    isSystemGroup() {
        return this.system === true;
    }

    /**
     * Check if group is admin group
     */
    isAdminGroup() {
        return this.name === 'admin' || this.name === 'subscription_admin';
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            permissions: [...this.permissions],
            system: this.system,
            metadata: { ...this.metadata },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        return new Group(data);
    }

    /**
     * Clone group
     */
    clone() {
        return new Group(this.toJSON());
    }

    /**
     * Update group data
     */
    update(data) {
        if (data.name !== undefined && !this.system) {
            // Don't allow renaming system groups
            this.name = data.name;
        }
        if (data.description !== undefined) this.description = data.description;
        if (data.permissions !== undefined) this.permissions = [...data.permissions];
        if (data.metadata !== undefined) this.metadata = { ...data.metadata };
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Check equality
     */
    equals(other) {
        if (!(other instanceof Group)) return false;
        return this.name === other.name;
    }

    /**
     * Get display name
     */
    getDisplayName() {
        return this.description || this.name;
    }

    /**
     * Get default system groups
     */
    static getSystemGroups() {
        return [
            new Group({
                name: 'subscription_admin',
                description: 'Subscription administrators with full system access',
                permissions: ['subscription_management', 'user_management', 'system_config', 'ai_management'],
                system: true
            }),
            new Group({
                name: 'admin',
                description: 'System administrators',
                permissions: ['user_management', 'config_management', 'view_logs'],
                system: true
            }),
            new Group({
                name: 'default',
                description: 'Default user group',
                permissions: ['basic_access', 'chat_access'],
                system: false
            })
        ];
    }
}

module.exports = Group;