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
     * Get group by name - CORRECTED: no values() in view
     */
    getGroupSNL(groupName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, groupName);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Create or update group
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
     * Validate group data structure
     */
    validateGroupData(groupData) {
        if (!groupData || typeof groupData !== 'object') {
            throw new Error('Group data must be an object');
        }

        // Groups can have custom fields, but validate basic structure
        if (groupData.permissions && !Array.isArray(groupData.permissions)) {
            throw new Error('Group permissions must be an array');
        }

        if (groupData.description && typeof groupData.description !== 'string') {
            throw new Error('Group description must be a string');
        }

        return true;
    }

    /**
     * Default group structures
     */
    getDefaultGroups() {
        return {
            subscription_admin: {
                description: 'Subscription administrators',
                permissions: ['subscription_management'],
                system: true
            },
            admin: {
                description: 'System administrators',
                permissions: ['user_management', 'system_config'],
                system: true
            },
            default: {
                description: 'Default user group',
                permissions: ['basic_access'],
                system: true
            }
        };
    }
}

module.exports = GroupSNL;