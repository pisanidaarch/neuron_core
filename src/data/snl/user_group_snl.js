// src/data/snl/user_group_snl.js

/**
 * UserGroupSNL - SNL commands for UserGroup entity operations
 */
class UserGroupSNL {
    constructor() {
        this.namespace = 'main.core';
        this.entityName = 'usergroups';
    }

    /**
     * Check if usergroups structure exists
     * @returns {string}
     */
    checkGroupsStructureExistsSNL() {
        return `list(structure)\nvalues("${this.entityName}")\non(${this.namespace})`;
    }

    /**
     * Create usergroups structure if not exists
     * @returns {string}
     */
    createGroupsStructureSNL() {
        return `set(structure)\nvalues("${this.entityName}", {})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Set user group SNL
     * @param {string} groupName - Group name
     * @param {Object} groupData - Group data
     * @returns {string}
     */
    setGroupSNL(groupName, groupData) {
        return `set(structure)\nvalues("${groupName}", ${JSON.stringify(groupData)})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get user group SNL
     * @param {string} groupName - Group name
     * @returns {string}
     */
    getGroupSNL(groupName) {
        return `view(structure)\nvalues("${groupName}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * List user groups SNL
     * @returns {string}
     */
    listGroupsSNL() {
        return `list(structure)\nvalues("*")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Remove user group SNL
     * @param {string} groupName - Group name
     * @returns {string}
     */
    removeGroupSNL(groupName) {
        return `remove(structure)\nvalues("${groupName}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Search groups SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchGroupsSNL(searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Build group data for storage
     * @param {UserGroup} group - UserGroup entity
     * @returns {Object}
     */
    buildGroupData(group) {
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            permissions: group.permissions,
            isHidden: group.isHidden,
            isSystem: group.isSystem,
            aiName: group.aiName,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt
        };
    }

    /**
     * Parse structure exists response
     * @param {Object} response - SNL response
     * @returns {boolean}
     */
    parseStructureExistsResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }

        // If usergroups entity exists, response should contain it
        return Object.prototype.hasOwnProperty.call(response, this.entityName);
    }

    /**
     * Parse groups list response
     * @param {Object} response - SNL response
     * @returns {Array<string>}
     */
    parseGroupsList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        // Extract group names from response, excluding the entity name itself
        return Object.keys(response).filter(key => key !== this.entityName);
    }

    /**
     * Parse group data response
     * @param {Object} response - SNL response
     * @returns {Object}
     */
    parseGroupData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Return the first non-entity object found
        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                return value;
            }
        }

        return null;
    }

    /**
     * Validate group name
     * @param {string} groupName - Group name to validate
     * @throws {Error} If group name is invalid
     */
    validateGroupName(groupName) {
        if (!groupName || typeof groupName !== 'string') {
            throw new Error('Group name must be a non-empty string');
        }

        if (groupName.length > 50) {
            throw new Error('Group name must be 50 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!validNamePattern.test(groupName)) {
            throw new Error('Group name can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Get default subscription admin credentials
     * @returns {Object}
     */
    getDefaultSubscriptionAdminCredentials() {
        return {
            username: 'subscription_admin',
            password: 'sudo_subscription_admin',
            email: 'subscription_admin@system.local'
        };
    }
}

module.exports = UserGroupSNL;