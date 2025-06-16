// src/data/manager/user_group_manager.js

const UserGroup = require('../../cross/entity/user_group');
const UserGroupSNL = require('../snl/user_group_snl');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * UserGroupManager - Manages UserGroup entity operations
 */
class UserGroupManager {
    constructor(aiKey) {
        this.aiKey = aiKey;
        this.groupSNL = new UserGroupSNL();
        this.sender = new NeuronDBSender();
    }

    /**
     * Initialize user groups structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.groupSNL.checkUserGroupsStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiKey);

            const exists = this.groupSNL.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.groupSNL.createUserGroupsStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiKey);
            }

            // Create default system groups
            await this.createDefaultGroups();
        } catch (error) {
            console.error('Failed to initialize user groups structure:', error);
            throw error;
        }
    }

    /**
     * Create default system groups
     * @returns {Promise<void>}
     */
    async createDefaultGroups() {
        const defaultGroups = [
            UserGroup.createSystemGroup('subscription_admin', 'System group for subscription management'),
            UserGroup.createSystemGroup('admin', 'Administrator group with full permissions'),
            UserGroup.createSystemGroup('default', 'Default user group with basic permissions')
        ];

        for (const group of defaultGroups) {
            const exists = await this.groupExists(group.name);
            if (!exists) {
                await this.saveGroup(group);
            }
        }
    }

    /**
     * Create or update group
     * @param {UserGroup} group - UserGroup entity
     * @returns {Promise<UserGroup>}
     */
    async saveGroup(group) {
        try {
            const validation = group.validate();
            if (!validation.valid) {
                throw new Error(`Group validation failed: ${validation.errors.join(', ')}`);
            }

            const groupData = this.groupSNL.buildGroupData(group);
            const command = this.groupSNL.setGroupSNL(group.name, groupData);
            await this.sender.executeSNL(command, this.aiKey);

            return group;
        } catch (error) {
            console.error('Failed to save group:', error);
            throw error;
        }
    }

    /**
     * Get group by name
     * @param {string} groupName - Group name
     * @returns {Promise<UserGroup|null>}
     */
    async getGroup(groupName) {
        try {
            const command = this.groupSNL.getGroupSNL(groupName);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const groupData = this.groupSNL.parseGroupResponse(response);
            if (!groupData) {
                return null;
            }

            return UserGroup.fromNeuronDB(groupName, groupData);
        } catch (error) {
            console.error('Failed to get group:', error);
            return null;
        }
    }

    /**
     * Get all groups
     * @returns {Promise<UserGroup[]>}
     */
    async getAllGroups() {
        try {
            const command = this.groupSNL.getAllGroupsSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            const groupsData = this.groupSNL.parseAllGroupsResponse(response);
            const groups = [];

            for (const [groupName, groupData] of Object.entries(groupsData)) {
                const group = UserGroup.fromNeuronDB(groupName, groupData);
                groups.push(group);
            }

            return groups;
        } catch (error) {
            console.error('Failed to get all groups:', error);
            return [];
        }
    }

    /**
     * Get visible groups only (not hidden)
     * @returns {Promise<UserGroup[]>}
     */
    async getVisibleGroups() {
        try {
            const allGroups = await this.getAllGroups();
            return allGroups.filter(group => !group.hidden);
        } catch (error) {
            console.error('Failed to get visible groups:', error);
            return [];
        }
    }

    /**
     * Get system groups only
     * @returns {Promise<UserGroup[]>}
     */
    async getSystemGroups() {
        try {
            const allGroups = await this.getAllGroups();
            return allGroups.filter(group => group.system_group);
        } catch (error) {
            console.error('Failed to get system groups:', error);
            return [];
        }
    }

    /**
     * Get list of group names
     * @returns {Promise<string[]>}
     */
    async getGroupList() {
        try {
            const command = this.groupSNL.getListGroupsSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.groupSNL.parseGroupsListResponse(response);
        } catch (error) {
            console.error('Failed to get group list:', error);
            return [];
        }
    }

    /**
     * Search groups
     * @param {string} searchTerm - Search term
     * @returns {Promise<UserGroup[]>}
     */
    async searchGroups(searchTerm) {
        try {
            const command = this.groupSNL.searchGroupsSNL(searchTerm);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const searchResults = this.groupSNL.parseSearchResponse(response);
            const groups = [];

            for (const groupData of searchResults) {
                const group = UserGroup.fromNeuronDB(groupData.name, groupData);
                groups.push(group);
            }

            return groups;
        } catch (error) {
            console.error('Failed to search groups:', error);
            return [];
        }
    }

    /**
     * Remove group
     * @param {string} groupName - Group name
     * @returns {Promise<boolean>}
     */
    async removeGroup(groupName) {
        try {
            // Check if it's a system group
            const group = await this.getGroup(groupName);
            if (group && group.system_group) {
                throw new Error('Cannot remove system group');
            }

            const command = this.groupSNL.removeGroupSNL(groupName);
            await this.sender.executeSNL(command, this.aiKey);
            return true;
        } catch (error) {
            console.error('Failed to remove group:', error);
            return false;
        }
    }

    /**
     * Check if group exists
     * @param {string} groupName - Group name
     * @returns {Promise<boolean>}
     */
    async groupExists(groupName) {
        const group = await this.getGroup(groupName);
        return group !== null;
    }

    /**
     * Add member to group
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async addMemberToGroup(groupName, userEmail) {
        try {
            const group = await this.getGroup(groupName);
            if (!group) {
                throw new Error('Group not found');
            }

            group.addMember(userEmail);
            await this.saveGroup(group);
            return true;
        } catch (error) {
            console.error('Failed to add member to group:', error);
            return false;
        }
    }

    /**
     * Remove member from group
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async removeMemberFromGroup(groupName, userEmail) {
        try {
            const group = await this.getGroup(groupName);
            if (!group) {
                throw new Error('Group not found');
            }

            group.removeMember(userEmail);
            await this.saveGroup(group);
            return true;
        } catch (error) {
            console.error('Failed to remove member from group:', error);
            return false;
        }
    }

    /**
     * Check if user is member of group
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async isUserInGroup(groupName, userEmail) {
        try {
            const group = await this.getGroup(groupName);
            if (!group) {
                return false;
            }

            return group.hasMember(userEmail);
        } catch (error) {
            console.error('Failed to check group membership:', error);
            return false;
        }
    }

    /**
     * Get groups that user belongs to
     * @param {string} userEmail - User email
     * @returns {Promise<UserGroup[]>}
     */
    async getUserGroups(userEmail) {
        try {
            const allGroups = await this.getAllGroups();
            return allGroups.filter(group => group.hasMember(userEmail));
        } catch (error) {
            console.error('Failed to get user groups:', error);
            return [];
        }
    }

    /**
     * Get group members
     * @param {string} groupName - Group name
     * @returns {Promise<string[]>}
     */
    async getGroupMembers(groupName) {
        try {
            const group = await this.getGroup(groupName);
            if (!group) {
                return [];
            }

            return group.members;
        } catch (error) {
            console.error('Failed to get group members:', error);
            return [];
        }
    }

    /**
     * Create a new group
     * @param {string} groupName - Group name
     * @param {string} description - Group description
     * @param {string[]} members - Initial members
     * @returns {Promise<UserGroup>}
     */
    async createGroup(groupName, description = '', members = []) {
        try {
            const group = new UserGroup({
                name: groupName,
                description,
                members: [...members] // Copy array
            });

            return await this.saveGroup(group);
        } catch (error) {
            console.error('Failed to create group:', error);
            throw error;
        }
    }

    /**
     * Add subscription admin user to subscription_admin group
     * @param {string} userEmail - User email (subscription admin)
     * @returns {Promise<boolean>}
     */
    async addSubscriptionAdmin(userEmail) {
        return await this.addMemberToGroup('subscription_admin', userEmail);
    }

    /**
     * Check if user is subscription admin
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async isSubscriptionAdmin(userEmail) {
        return await this.isUserInGroup('subscription_admin', userEmail);
    }

    /**
     * Check if user is admin
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async isAdmin(userEmail) {
        return await this.isUserInGroup('admin', userEmail);
    }

    /**
     * Check if user is default user
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async isDefaultUser(userEmail) {
        return await this.isUserInGroup('default', userEmail);
    }
}

module.exports = UserGroupManager;