// src/data/manager/user_group_manager.js

const UserGroup = require('../../cross/entity/user_group');
const UserGroupSNL = require('../snl/user_group_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * UserGroupManager - Manages UserGroup entity operations
 */
class UserGroupManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new UserGroupSNL();
        this.sender = new AISender();
    }

    /**
     * Initialize user groups structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.snl.checkGroupsStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiToken);

            const exists = this.snl.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.snl.createGroupsStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiToken);
                console.log('✅ User groups structure created');
            }
        } catch (error) {
            console.error('Failed to initialize user groups structure:', error);
            throw error;
        }
    }

    /**
     * Create or update user group
     * @param {UserGroup} group - UserGroup entity
     * @returns {Promise<UserGroup>}
     */
    async saveGroup(group) {
        try {
            const validation = group.validate();
            if (!validation.valid) {
                throw new ValidationError(`Group validation failed: ${validation.errors.join(', ')}`);
            }

            group.updatedAt = new Date().toISOString();
            const groupData = this.snl.buildGroupData(group);
            const command = this.snl.setGroupSNL(group.name, groupData);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Group saved: ${group.name}`);
            return group;
        } catch (error) {
            console.error('Failed to save group:', error);
            throw error;
        }
    }

    /**
     * Get user group by name
     * @param {string} groupName - Group name
     * @returns {Promise<UserGroup|null>}
     */
    async getGroup(groupName) {
        try {
            const command = this.snl.getGroupSNL(groupName);
            const response = await this.sender.executeSNL(command, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const groupData = this.snl.parseGroupData(response);
            return UserGroup.fromObject(groupData);
        } catch (error) {
            console.error('Failed to get group:', error);
            throw error;
        }
    }

    /**
     * List all user groups (visible only unless admin)
     * @param {boolean} includeHidden - Include hidden groups
     * @returns {Promise<UserGroup[]>}
     */
    async listGroups(includeHidden = false) {
        try {
            const command = this.snl.listGroupsSNL();
            const response = await this.sender.executeSNL(command, this.aiToken);

            const groupNames = this.snl.parseGroupsList(response);
            const groups = [];

            for (const groupName of groupNames) {
                const group = await this.getGroup(groupName);
                if (group && (includeHidden || !group.isHidden)) {
                    groups.push(group);
                }
            }

            return groups;
        } catch (error) {
            console.error('Failed to list groups:', error);
            throw error;
        }
    }

    /**
     * Get visible groups only (for non-admin users)
     * @returns {Promise<UserGroup[]>}
     */
    async getVisibleGroups() {
        return this.listGroups(false);
    }

    /**
     * Delete user group
     * @param {string} groupName - Group name
     * @returns {Promise<boolean>}
     */
    async deleteGroup(groupName) {
        try {
            // Check if group exists first
            const existingGroup = await this.getGroup(groupName);
            if (!existingGroup) {
                throw new NotFoundError(`Group not found: ${groupName}`);
            }

            // Prevent deletion of system groups
            if (existingGroup.isSystem) {
                throw new ValidationError(`Cannot delete system group: ${groupName}`);
            }

            const command = this.snl.removeGroupSNL(groupName);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Group deleted: ${groupName}`);
            return true;
        } catch (error) {
            console.error('Failed to delete group:', error);
            throw error;
        }
    }

    /**
     * Create default system groups for AI
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async createDefaultGroups(aiName) {
        try {
            console.log(`Creating default groups for AI: ${aiName}`);

            // Create subscription_admin group
            const subscriptionAdminGroup = UserGroup.createSubscriptionAdminGroup(aiName);
            await this.saveGroup(subscriptionAdminGroup);

            // Create admin group
            const adminGroup = UserGroup.createAdminGroup(aiName);
            await this.saveGroup(adminGroup);

            // Create default group
            const defaultGroup = UserGroup.createDefaultGroup(aiName);
            await this.saveGroup(defaultGroup);

            console.log(`✅ Default groups created for AI: ${aiName}`);
        } catch (error) {
            console.error(`Failed to create default groups for AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Check if group exists
     * @param {string} groupName - Group name
     * @returns {Promise<boolean>}
     */
    async groupExists(groupName) {
        try {
            const group = await this.getGroup(groupName);
            return group !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Update group permissions
     * @param {string} groupName - Group name
     * @param {string[]} permissions - New permissions array
     * @returns {Promise<UserGroup>}
     */
    async updateGroupPermissions(groupName, permissions) {
        try {
            const group = await this.getGroup(groupName);
            if (!group) {
                throw new NotFoundError(`Group not found: ${groupName}`);
            }

            group.permissions = permissions;
            group.updatedAt = new Date().toISOString();

            return await this.saveGroup(group);
        } catch (error) {
            console.error('Failed to update group permissions:', error);
            throw error;
        }
    }
}

module.exports = UserGroupManager;