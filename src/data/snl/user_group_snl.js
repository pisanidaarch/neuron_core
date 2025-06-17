// src/data/snl/user_group_snl.js

/**
 * User Group SNL - Group management SNL commands
 */
class UserGroupSNL {
    constructor() {
        this.entityName = 'usergroup';
    }

    /**
     * Generate create group SNL command
     * @param {Object} groupData - Group data
     * @returns {string} SNL command
     */
    generateCreateGroupSNL(groupData) {
        const { name, description, permissions = [], isHidden = false, isSystem = false } = groupData;

        const groupObject = {
            name,
            description,
            permissions,
            isHidden,
            isSystem,
            members: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        return `set(structure)\nvalues("${this.entityName}", ${JSON.stringify(groupObject)})\non(main.core.${name})`;
    }

    /**
     * Generate get group SNL command
     * @param {string} groupName - Group name
     * @returns {string} SNL command
     */
    generateGetGroupSNL(groupName) {
        return `view(structure)\nvalues("${this.entityName}")\non(main.core.${groupName})`;
    }

    /**
     * Generate list groups SNL command
     * @param {boolean} includeHidden - Include hidden groups
     * @returns {string} SNL command
     */
    generateListGroupsSNL(includeHidden = false) {
        if (includeHidden) {
            return `list(structure)\nvalues("${this.entityName}")\non(main.core)`;
        } else {
            return `search(structure)\nvalues("${this.entityName}")\nmatch("isHidden", false)\non(main.core)`;
        }
    }

    /**
     * Generate add member to group SNL command
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email to add
     * @returns {string} SNL command
     */
    generateAddMemberSNL(groupName, userEmail) {
        // First get current group data, then update with new member
        return `view(structure)\nvalues("${this.entityName}")\non(main.core.${groupName})`;
    }

    /**
     * Generate update group with new member SNL command
     * @param {string} groupName - Group name
     * @param {Array} updatedMembers - Updated members array
     * @returns {string} SNL command
     */
    generateUpdateGroupMembersSNL(groupName, updatedMembers) {
        const updateData = {
            members: updatedMembers,
            updated_at: new Date().toISOString()
        };

        return `set(structure)\nvalues("${this.entityName}", ${JSON.stringify(updateData)})\non(main.core.${groupName})`;
    }

    /**
     * Generate remove member from group SNL command
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email to remove
     * @returns {string} SNL command
     */
    generateRemoveMemberSNL(groupName, userEmail) {
        // First get current group data, then update without the member
        return `view(structure)\nvalues("${this.entityName}")\non(main.core.${groupName})`;
    }

    /**
     * Generate delete group SNL command
     * @param {string} groupName - Group name
     * @returns {string} SNL command
     */
    generateDeleteGroupSNL(groupName) {
        return `remove(structure)\nvalues("${this.entityName}")\non(main.core.${groupName})`;
    }

    /**
     * Generate get user groups SNL command
     * @param {string} userEmail - User email
     * @returns {string} SNL command
     */
    generateGetUserGroupsSNL(userEmail) {
        return `search(structure)\nvalues("${this.entityName}")\nmatch("members", "${userEmail}")\non(main.core)`;
    }

    /**
     * Parse group data from SNL response
     * @param {Object} response - SNL response
     * @returns {Object|null} Group data
     */
    parseGroupData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Look for group data in the response
        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                if (value.name) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * Parse groups list from SNL response
     * @param {Object} response - SNL response
     * @returns {Array} Array of groups
     */
    parseGroupsList(response) {
        const groups = [];

        if (!response || typeof response !== 'object') {
            return groups;
        }

        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                if (value.name) {
                    groups.push(value);
                }
            }
        }

        return groups;
    }

    /**
     * Get default system groups
     * @returns {Array} Default groups
     */
    getDefaultSystemGroups() {
        return [
            {
                name: 'subscription_admin',
                description: 'System group for payment gateway integration',
                permissions: [
                    'subscription.create',
                    'subscription.cancel',
                    'subscription.change_plan',
                    'subscription.view_all'
                ],
                isHidden: true,
                isSystem: true
            },
            {
                name: 'admin',
                description: 'Administrators who purchase AI subscriptions',
                permissions: [
                    'user.create',
                    'user.delete',
                    'user.update',
                    'user.view_all',
                    'config.update_theme',
                    'config.update_behavior',
                    'subscription.cancel',
                    'subscription.change_plan',
                    'database.view',
                    'namespace.view'
                ],
                isHidden: false,
                isSystem: true
            },
            {
                name: 'default',
                description: 'Default users of the AI',
                permissions: [
                    'ai.chat',
                    'ai.command_execute',
                    'timeline.view_own',
                    'timeline.create',
                    'user_data.view_own',
                    'user_data.create_own',
                    'user_data.update_own'
                ],
                isHidden: false,
                isSystem: true
            }
        ];
    }

    /**
     * Validate group data
     * @param {Object} groupData - Group data to validate
     * @returns {Array} Array of validation errors
     */
    validateGroupData(groupData) {
        const errors = [];

        if (!groupData.name || typeof groupData.name !== 'string') {
            errors.push('Group name is required and must be a string');
        } else if (groupData.name.length < 2) {
            errors.push('Group name must be at least 2 characters long');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(groupData.name)) {
            errors.push('Group name can only contain letters, numbers, underscores, and hyphens');
        }

        if (!groupData.description || typeof groupData.description !== 'string') {
            errors.push('Group description is required and must be a string');
        }

        if (groupData.permissions && !Array.isArray(groupData.permissions)) {
            errors.push('Permissions must be an array');
        }

        return errors;
    }

    /**
     * Get default subscription admin credentials
     * @returns {Object} Default credentials
     */
    getDefaultSubscriptionAdminCredentials() {
        return {
            email: 'subscription_admin@system.local',
            password: 'sudo_subscription_admin',
            nick: 'Subscription Admin',
            permissions: {
                main: 5 // Admin level
            }
        };
    }
}

module.exports = UserGroupSNL;