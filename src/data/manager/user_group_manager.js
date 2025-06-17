// src/data/manager/user_group_manager.js

const UserGroupSNL = require('../snl/user_group_snl');
const { NeuronDBError, ValidationError } = require('../../cross/entity/errors');

/**
 * User Group Manager - Manages user groups and permissions
 */
class UserGroupManager {
    constructor() {
        this.groupSNL = new UserGroupSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     * @param {Object} aiSender - AI sender instance
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Initialize default system groups
     * @returns {Promise<void>}
     */
    async initializeDefaultGroups() {
        try {
            console.log('   🔒 Initializing default groups...');

            const defaultGroups = this.groupSNL.getDefaultSystemGroups();

            for (const groupData of defaultGroups) {
                try {
                    // Check if group already exists
                    const existingGroup = await this.getGroup(groupData.name);

                    if (!existingGroup) {
                        await this.createGroup(groupData);
                        console.log(`     ✅ Created group: ${groupData.name}`);
                    } else {
                        console.log(`     ✓ Group already exists: ${groupData.name}`);
                    }
                } catch (error) {
                    console.error(`     ❌ Failed to create group ${groupData.name}:`, error.message);
                }
            }

            console.log('   ✅ Default groups initialized');

        } catch (error) {
            console.error('Failed to initialize default groups:', error);
            throw error;
        }
    }

    /**
     * Create new group
     * @param {Object} groupData - Group data
     * @returns {Promise<Object>} Created group
     */
    async createGroup(groupData) {
        try {
            // Validate group data
            const validationErrors = this.groupSNL.validateGroupData(groupData);
            if (validationErrors.length > 0) {
                throw new ValidationError(`Group validation failed: ${validationErrors.join(', ')}`);
            }

            // Check if group already exists
            const existingGroup = await this.getGroup(groupData.name);
            if (existingGroup) {
                throw new ValidationError(`Group '${groupData.name}' already exists`);
            }

            // Create group
            const createGroupSNL = this.groupSNL.generateCreateGroupSNL(groupData);
            await this.sender.executeSNL(createGroupSNL);

            return {
                success: true,
                group: {
                    name: groupData.name,
                    description: groupData.description,
                    permissions: groupData.permissions || [],
                    isHidden: groupData.isHidden || false,
                    isSystem: groupData.isSystem || false,
                    created_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Create group error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Group creation failed: ${error.message}`);
        }
    }

    /**
     * Get group by name
     * @param {string} groupName - Group name
     * @returns {Promise<Object|null>} Group data or null if not found
     */
    async getGroup(groupName) {
        try {
            const getGroupSNL = this.groupSNL.generateGetGroupSNL(groupName);
            const response = await this.sender.executeSNL(getGroupSNL);

            return this.groupSNL.parseGroupData(response);

        } catch (error) {
            // Group not found is not an error
            if (error.message && error.message.includes('not found')) {
                return null;
            }

            console.error('Get group error:', error);
            throw new NeuronDBError(`Failed to get group: ${error.message}`);
        }
    }

    /**
     * List all groups
     * @param {boolean} includeHidden - Include hidden groups
     * @returns {Promise<Array>} Array of groups
     */
    async listGroups(includeHidden = false) {
        try {
            const listGroupsSNL = this.groupSNL.generateListGroupsSNL(includeHidden);
            const response = await this.sender.executeSNL(listGroupsSNL);

            return this.groupSNL.parseGroupsList(response);

        } catch (error) {
            console.error('List groups error:', error);
            throw new NeuronDBError(`Failed to list groups: ${error.message}`);
        }
    }

    /**
     * Add member to group
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email
     * @returns {Promise<Object>} Success result
     */
    async addMemberToGroup(groupName, userEmail) {
        try {
            // Get current group data
            const groupData = await this.getGroup(groupName);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            // Check if user is already a member
            if (groupData.members && groupData.members.includes(userEmail)) {
                return {
                    success: true,
                    message: `User is already a member of group '${groupName}'`
                };
            }

            // Add user to members array
            const updatedMembers = [...(groupData.members || []), userEmail];

            const updateSNL = this.groupSNL.generateUpdateGroupMembersSNL(groupName, updatedMembers);
            await this.sender.executeSNL(updateSNL);

            return {
                success: true,
                message: `User '${userEmail}' added to group '${groupName}'`
            };

        } catch (error) {
            console.error('Add member to group error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to add member to group: ${error.message}`);
        }
    }

    /**
     * Remove member from group
     * @param {string} groupName - Group name
     * @param {string} userEmail - User email
     * @returns {Promise<Object>} Success result
     */
    async removeMemberFromGroup(groupName, userEmail) {
        try {
            // Get current group data
            const groupData = await this.getGroup(groupName);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            // Check if user is a member
            if (!groupData.members || !groupData.members.includes(userEmail)) {
                return {
                    success: true,
                    message: `User is not a member of group '${groupName}'`
                };
            }

            // Remove user from members array
            const updatedMembers = groupData.members.filter(email => email !== userEmail);

            const updateSNL = this.groupSNL.generateUpdateGroupMembersSNL(groupName, updatedMembers);
            await this.sender.executeSNL(updateSNL);

            return {
                success: true,
                message: `User '${userEmail}' removed from group '${groupName}'`
            };

        } catch (error) {
            console.error('Remove member from group error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to remove member from group: ${error.message}`);
        }
    }

    /**
     * Get user groups
     * @param {string} userEmail - User email
     * @returns {Promise<Array>} Array of groups the user belongs to
     */
    async getUserGroups(userEmail) {
        try {
            const getUserGroupsSNL = this.groupSNL.generateGetUserGroupsSNL(userEmail);
            const response = await this.sender.executeSNL(getUserGroupsSNL);

            return this.groupSNL.parseGroupsList(response);

        } catch (error) {
            console.error('Get user groups error:', error);
            throw new NeuronDBError(`Failed to get user groups: ${error.message}`);
        }
    }

    /**
     * Update group permissions
     * @param {string} groupName - Group name
     * @param {Array} permissions - New permissions array
     * @returns {Promise<Object>} Success result
     */
    async updateGroupPermissions(groupName, permissions) {
        try {
            // Get current group data
            const groupData = await this.getGroup(groupName);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            // Update with new permissions
            const updateData = {
                ...groupData,
                permissions: permissions,
                updated_at: new Date().toISOString()
            };

            const updateSNL = this.groupSNL.generateCreateGroupSNL(updateData); // Reuse create for update
            await this.sender.executeSNL(updateSNL);

            return {
                success: true,
                message: `Permissions updated for group '${groupName}'`
            };

        } catch (error) {
            console.error('Update group permissions error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to update group permissions: ${error.message}`);
        }
    }

    /**
     * Delete group
     * @param {string} groupName - Group name
     * @returns {Promise<Object>} Success result
     */
    async deleteGroup(groupName) {
        try {
            // Get group data first to check if it's a system group
            const groupData = await this.getGroup(groupName);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            if (groupData.isSystem) {
                throw new ValidationError(`Cannot delete system group '${groupName}'`);
            }

            const deleteGroupSNL = this.groupSNL.generateDeleteGroupSNL(groupName);
            await this.sender.executeSNL(deleteGroupSNL);

            return {
                success: true,
                message: `Group '${groupName}' deleted successfully`
            };

        } catch (error) {
            console.error('Delete group error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to delete group: ${error.message}`);
        }
    }

    /**
     * Check if user has specific permission
     * @param {string} userEmail - User email
     * @param {string} permission - Permission to check
     * @returns {Promise<boolean>} True if user has permission
     */
    async userHasPermission(userEmail, permission) {
        try {
            const userGroups = await this.getUserGroups(userEmail);

            for (const group of userGroups) {
                if (group.permissions && group.permissions.includes(permission)) {
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('Check user permission error:', error);
            return false; // Default to no permission on error
        }
    }

    /**
     * Get all permissions for a user
     * @param {string} userEmail - User email
     * @returns {Promise<Array>} Array of permissions
     */
    async getUserPermissions(userEmail) {
        try {
            const userGroups = await this.getUserGroups(userEmail);
            const permissions = new Set();

            for (const group of userGroups) {
                if (group.permissions) {
                    group.permissions.forEach(permission => permissions.add(permission));
                }
            }

            return Array.from(permissions);

        } catch (error) {
            console.error('Get user permissions error:', error);
            return []; // Default to no permissions on error
        }
    }
}

module.exports = UserGroupManager;