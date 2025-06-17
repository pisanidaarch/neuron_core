// src/data/manager/group_manager.js

const BaseManager = require('./base_manager');
const GroupSNL = require('../snl/group_snl');
const Group = require('../../cross/entity/group');
const { ValidationError, NotFoundError, ConflictError } = require('../../cross/entity/errors');

/**
 * Group Manager - Manages group operations
 * Implements the flow: entity => manager => snl => sender => manager => entity
 */
class GroupManager extends BaseManager {
    constructor() {
        super();
        this.snl = new GroupSNL();
    }

    /**
     * Create group
     * @param {Group} groupEntity - Group entity to create
     * @param {string} token - Authentication token
     * @returns {Group} Created group entity
     */
    async createGroup(groupEntity, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(groupEntity);

            // Check if group already exists
            const exists = await this.groupExists(groupEntity.name, token);
            if (exists) {
                throw new ConflictError(`Group already exists: ${groupEntity.name}`);
            }

            // Transform entity for storage
            const groupData = this.transformForStorage(groupEntity);

            // Generate SNL command
            const snlCommand = this.snl.setGroupSNL(groupEntity.name, groupData);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('createGroup', { name: groupEntity.name });

            // Return created entity
            return this.transformToEntity({
                name: groupEntity.name,
                ...groupData,
                createdAt: new Date().toISOString()
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get group by name
     * @param {string} name - Group name
     * @param {string} token - Authentication token
     * @returns {Group} Group entity
     */
    async getGroup(name, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.getGroupSNL(name);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            if (!response || Object.keys(response).length === 0) {
                throw new NotFoundError(`Group not found: ${name}`);
            }

            // Parse response
            const groupData = this.snl.parseGroup(response);

            // Transform to entity
            return this.transformToEntity(groupData);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update group
     * @param {Group} groupEntity - Group entity with updates
     * @param {string} token - Authentication token
     * @returns {Group} Updated group entity
     */
    async updateGroup(groupEntity, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(groupEntity);

            // Get existing group
            const existingGroup = await this.getGroup(groupEntity.name, token);

            // Prevent updating system groups in certain ways
            if (existingGroup.isSystemGroup() && !groupEntity.system) {
                throw new ValidationError('Cannot remove system flag from system group');
            }

            // Merge with existing data
            const updatedData = {
                ...existingGroup.toJSON(),
                ...this.transformForStorage(groupEntity),
                updatedAt: new Date().toISOString()
            };

            // Generate SNL command
            const snlCommand = this.snl.setGroupSNL(groupEntity.name, updatedData);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('updateGroup', { name: groupEntity.name });

            // Return updated entity
            return this.transformToEntity({
                name: groupEntity.name,
                ...updatedData
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * List groups
     * @param {string} pattern - Search pattern (default: '*')
     * @param {string} token - Authentication token
     * @returns {Group[]} Array of group entities
     */
    async listGroups(pattern = '*', token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.listGroupsSNL(pattern);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            const groupList = this.snl.parseGroupList(response);

            // Transform each to entity
            return groupList.map(groupData => this.transformToEntity(groupData));

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete group
     * @param {string} name - Group name
     * @param {string} token - Authentication token
     */
    async deleteGroup(name, token) {
        this.validateInitialized();

        try {
            // Get group to check if it's a system group
            const group = await this.getGroup(name, token);

            if (group.isSystemGroup()) {
                throw new ValidationError('Cannot delete system group');
            }

            // Generate SNL command
            const snlCommand = this.snl.removeGroupSNL(name);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('deleteGroup', { name });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Add permission to group
     * @param {string} groupName - Group name
     * @param {string} permission - Permission to add
     * @param {string} token - Authentication token
     * @returns {Group} Updated group
     */
    async addPermission(groupName, permission, token) {
        this.validateInitialized();

        try {
            // Get existing group
            const group = await this.getGroup(groupName, token);

            // Add permission
            group.addPermission(permission);

            // Update group
            return await this.updateGroup(group, token);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Remove permission from group
     * @param {string} groupName - Group name
     * @param {string} permission - Permission to remove
     * @param {string} token - Authentication token
     * @returns {Group} Updated group
     */
    async removePermission(groupName, permission, token) {
        this.validateInitialized();

        try {
            // Get existing group
            const group = await this.getGroup(groupName, token);

            // Remove permission
            group.removePermission(permission);

            // Update group
            return await this.updateGroup(group, token);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate group entity
     * @param {Group} entity - Group entity to validate
     */
    validateEntity(entity) {
        if (!entity || !(entity instanceof Group)) {
            throw new ValidationError('Invalid group entity');
        }

        const errors = entity.validate();
        if (errors.length > 0) {
            throw new ValidationError(`Group validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Transform group entity for storage
     * @param {Group} entity - Group entity
     * @returns {Object} Data for storage
     */
    transformForStorage(entity) {
        const data = entity.toJSON();

        // Remove name from data (it's used as key)
        delete data.name;

        return data;
    }

    /**
     * Transform response data to group entity
     * @param {Object} data - Response data
     * @returns {Group} Group entity
     */
    transformToEntity(data) {
        return new Group(data);
    }

    /**
     * Check if group exists
     * @param {string} name - Group name
     * @param {string} token - Authentication token
     * @returns {boolean} True if group exists
     */
    async groupExists(name, token) {
        try {
            await this.getGroup(name, token);
            return true;
        } catch (error) {
            if (error instanceof NotFoundError) {
                return false;
            }
            throw error;
        }
    }
}

module.exports = GroupManager;