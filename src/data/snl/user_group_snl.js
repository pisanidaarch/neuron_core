// src/data/snl/user_group_snl.js

/**
 * UserGroupSNL - SNL commands for UserGroup entity
 */
class UserGroupSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * Get groups list SNL
     * @returns {string}
     */
    getListGroupsSNL() {
        return 'list(structure)\nvalues("*")\non(main.core.usergroups)';
    }

    /**
     * Get specific group SNL
     * @param {string} groupName - Group name
     * @returns {string}
     */
    getGroupSNL(groupName) {
        if (!groupName) {
            throw new Error('Group name is required');
        }
        return `one(structure, id)\nvalues("${groupName}")\non(main.core.usergroups)`;
    }

    /**
     * Create/Update group SNL
     * @param {string} groupName - Group name
     * @param {Object} groupData - Group data
     * @returns {string}
     */
    setGroupSNL(groupName, groupData) {
        if (!groupName || !groupData) {
            throw new Error('Group name and data are required');
        }
        const groupDataJson = JSON.stringify(groupData);
        return `set(structure)\nvalues("${groupName}", ${groupDataJson})\non(main.core.usergroups)`;
    }

    /**
     * Remove group SNL
     * @param {string} groupName - Group name
     * @returns {string}
     */
    removeGroupSNL(groupName) {
        if (!groupName) {
            throw new Error('Group name is required');
        }
        return `remove(structure)\nvalues("${groupName}")\non(main.core.usergroups)`;
    }

    /**
     * Search groups SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchGroupsSNL(searchTerm) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        return `search(structure)\nvalues("${searchTerm}")\non(main.core.usergroups)`;
    }

    /**
     * Get all groups with their data
     * @returns {string}
     */
    getAllGroupsSNL() {
        return 'view(structure)\non(main.core.usergroups)';
    }

    /**
     * Parse groups list response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {Array} Array of group names
     */
    parseGroupsListResponse(response) {
        if (!response) return [];

        if (Array.isArray(response)) {
            return response;
        }

        if (typeof response === 'object') {
            return Object.keys(response);
        }

        return [];
    }

    /**
     * Parse single group response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object|null} Group data
     */
    parseGroupResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return {
            description: response.description || '',
            members: response.members || [],
            created_at: response.created_at,
            updated_at: response.updated_at,
            hidden: response.hidden || false,
            system_group: response.system_group || false
        };
    }

    /**
     * Parse all groups response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object} Object with group name as key and group data as value
     */
    parseAllGroupsResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        return response;
    }

    /**
     * Parse search results
     * @param {Object} response - Response from NeuronDB
     * @returns {Array} Array of matched groups
     */
    parseSearchResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const results = [];
        for (const [groupName, groupData] of Object.entries(response)) {
            results.push({
                name: groupName,
                ...groupData
            });
        }

        return results;
    }

    /**
     * Build group data for NeuronDB
     * @param {Object} group - UserGroup entity
     * @returns {Object} Group data formatted for NeuronDB
     */
    buildGroupData(group) {
        return {
            description: group.description,
            members: group.members,
            created_at: group.created_at,
            updated_at: group.updated_at,
            hidden: group.hidden,
            system_group: group.system_group
        };
    }

    /**
     * Create initial usergroups structure if it doesn't exist
     * @returns {string}
     */
    createUserGroupsStructureSNL() {
        return 'set(structure)\nvalues("usergroups", {})\non(main.core.usergroups)';
    }

    /**
     * Check if usergroups structure exists
     * @returns {string}
     */
    checkUserGroupsStructureExistsSNL() {
        return 'list(structure)\nvalues("usergroups")\non(main.core)';
    }

    /**
     * Parse structure exists response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {boolean} True if structure exists
     */
    parseStructureExistsResponse(response) {
        if (Array.isArray(response)) {
            return response.includes('usergroups');
        }

        if (typeof response === 'object') {
            return Object.keys(response).includes('usergroups');
        }

        return false;
    }

    /**
     * Get visible groups only (not hidden)
     * @returns {string}
     */
    getVisibleGroupsSNL() {
        return 'search(structure)\nvalues("hidden", false)\non(main.core.usergroups)';
    }

    /**
     * Get system groups only
     * @returns {string}
     */
    getSystemGroupsSNL() {
        return 'search(structure)\nvalues("system_group", true)\non(main.core.usergroups)';
    }

    /**
     * Parse filtered groups response
     * @param {Object} response - Response from NeuronDB
     * @returns {Array} Array of filtered groups
     */
    parseFilteredGroupsResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const groups = [];
        for (const [groupName, groupData] of Object.entries(response)) {
            groups.push({
                name: groupName,
                ...groupData
            });
        }

        return groups;
    }

    /**
     * Add member to group (update members array)
     * @param {string} groupName - Group name
     * @param {Array} members - Updated members array
     * @returns {string}
     */
    updateGroupMembersSNL(groupName, members) {
        if (!groupName || !Array.isArray(members)) {
            throw new Error('Group name and members array are required');
        }

        // First we need to get the group, update members, then set it back
        return this.getGroupSNL(groupName); // This will be handled in the manager
    }
}

module.exports = UserGroupSNL;