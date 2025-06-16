// src/cross/entity/user_group.js

/**
 * UserGroup Entity - Represents user groups in the system
 */
class UserGroup {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.permissions = data.permissions || [];
        this.isHidden = data.isHidden || false;
        this.isSystem = data.isSystem || false;
        this.aiName = data.aiName || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate the user group entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Group name is required');
        }

        if (this.name && this.name.length > 50) {
            errors.push('Group name must be 50 characters or less');
        }

        if (this.description && this.description.length > 255) {
            errors.push('Group description must be 255 characters or less');
        }

        if (!this.aiName || this.aiName.trim().length === 0) {
            errors.push('AI name is required');
        }

        if (!Array.isArray(this.permissions)) {
            errors.push('Permissions must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            permissions: this.permissions,
            isHidden: this.isHidden,
            isSystem: this.isSystem,
            aiName: this.aiName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {UserGroup}
     */
    static fromObject(data) {
        return new UserGroup(data);
    }

    /**
     * Check if group has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    /**
     * Add permission to group
     * @param {string} permission - Permission to add
     */
    addPermission(permission) {
        if (!this.hasPermission(permission)) {
            this.permissions.push(permission);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove permission from group
     * @param {string} permission - Permission to remove
     */
    removePermission(permission) {
        const index = this.permissions.indexOf(permission);
        if (index > -1) {
            this.permissions.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Get predefined system groups
     * @returns {Object}
     */
    static getSystemGroups() {
        return {
            SUBSCRIPTION_ADMIN: {
                name: 'subscription_admin',
                description: 'System group for payment gateway integration',
                permissions: ['subscription.create', 'subscription.cancel', 'subscription.change_plan'],
                isHidden: true,
                isSystem: true
            },
            ADMIN: {
                name: 'admin',
                description: 'Administrator group with AI management permissions',
                permissions: ['ai.configure', 'user.create', 'user.delete', 'subscription.manage'],
                isHidden: false,
                isSystem: false
            },
            DEFAULT: {
                name: 'default',
                description: 'Default user group with basic AI usage permissions',
                permissions: ['ai.use', 'user.profile.edit'],
                isHidden: false,
                isSystem: false
            }
        };
    }

    /**
     * Create default subscription admin user
     * @param {string} aiName - AI name
     * @returns {UserGroup}
     */
    static createSubscriptionAdminGroup(aiName) {
        const systemGroups = UserGroup.getSystemGroups();
        const group = new UserGroup({
            ...systemGroups.SUBSCRIPTION_ADMIN,
            aiName: aiName,
            id: `subscription_admin_${aiName}`
        });
        return group;
    }

    /**
     * Create default admin group
     * @param {string} aiName - AI name
     * @returns {UserGroup}
     */
    static createAdminGroup(aiName) {
        const systemGroups = UserGroup.getSystemGroups();
        const group = new UserGroup({
            ...systemGroups.ADMIN,
            aiName: aiName,
            id: `admin_${aiName}`
        });
        return group;
    }

    /**
     * Create default user group
     * @param {string} aiName - AI name
     * @returns {UserGroup}
     */
    static createDefaultGroup(aiName) {
        const systemGroups = UserGroup.getSystemGroups();
        const group = new UserGroup({
            ...systemGroups.DEFAULT,
            aiName: aiName,
            id: `default_${aiName}`
        });
        return group;
    }
}

module.exports = UserGroup;