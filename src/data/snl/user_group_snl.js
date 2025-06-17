// src/data/snl/group_snl.js

const BaseSNL = require('./base_snl');

/**
 * Group SNL - Generates SNL commands for group operations
 */
class GroupSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'main';
        this.namespace = 'core';
        this.entity = 'groups';
    }

    /**
     * Get group by name
     */
    getGroupSNL(groupName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, groupName);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set group (create or update)
     */
    setGroupSNL(groupName, groupData) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        const values = [groupName, groupData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * List all groups
     */
    listGroupsSNL(pattern = '*') {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search groups
     */
    searchGroupsSNL(searchTerm) {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove group
     */
    removeGroupSNL(groupName) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('remove', 'structure', groupName, path);
    }

    /**
     * Drop all groups entity
     */
    dropGroupsEntitySNL() {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('drop', 'structure', null, path);
    }

    /**
     * Tag a group
     */
    tagGroupSNL(groupName, tagName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, groupName);
        return this.buildSNL('tag', 'structure', tagName, path);
    }

    /**
     * Remove tag from group
     */
    untagGroupSNL(groupName, tagName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, groupName);
        return this.buildSNL('untag', 'structure', tagName, path);
    }

    /**
     * Match groups by tags
     */
    matchGroupsByTagSNL(tags) {
        const path = this.buildPath(this.database, this.namespace);
        const tagList = Array.isArray(tags) ? tags.join(',') : tags;
        return this.buildSNL('match', 'tag', tagList, path);
    }

    /**
     * Parse group from SNL response
     */
    parseGroup(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Response format: { "groupName": { groupData } }
        const names = Object.keys(response);
        if (names.length === 0) {
            return null;
        }

        const name = names[0];
        const groupData = response[name];

        return {
            name,
            ...groupData
        };
    }

    /**
     * Parse multiple groups from list response
     */
    parseGroupList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([name, groupData]) => ({
            name,
            ...groupData
        }));
    }

    /**
     * Validate group name
     */
    validateGroupName(groupName) {
        if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
            throw new Error('Group name is required');
        }

        // Group names should follow specific format
        if (!/^[a-zA-Z0-9_-]+$/.test(groupName)) {
            throw new Error('Group name can only contain letters, numbers, dashes, and underscores');
        }

        return true;
    }

    /**
     * Build group data structure
     */
    buildGroupData(permissions = [], description = '', isSystem = false) {
        return {
            permissions: permissions,
            description: description,
            isSystem: isSystem,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

module.exports = GroupSNL;