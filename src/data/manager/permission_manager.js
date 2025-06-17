// src/data/manager/permission_manager.js

const BaseManager = require('./base_manager');
const PermissionSNL = require('../snl/permission_snl');
const Permission = require('../../cross/entity/permission');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../cross/entity/errors');

/**
 * Permission Manager - Manages permission operations
 * Implements the flow: entity => manager => snl => sender => manager => entity
 */
class PermissionManager extends BaseManager {
    constructor() {
        super();
        this.snl = new PermissionSNL();
    }

    /**
     * Grant permission
     * @param {Permission} permissionEntity - Permission entity to grant
     * @param {string} grantedBy - Email of user granting permission
     * @param {string} token - Authentication token
     * @returns {Permission} Granted permission entity
     */
    async grantPermission(permissionEntity, grantedBy, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(permissionEntity);

            // Set grantedBy
            permissionEntity.grantedBy = grantedBy;

            // Build permission ID
            const permissionId = this.snl.buildPermissionId(
                permissionEntity.email,
                permissionEntity.database,
                permissionEntity.namespace,
                permissionEntity.entity
            );

            // Transform entity for storage
            const permissionData = this.transformForStorage(permissionEntity);

            // Generate SNL command
            const snlCommand = this.snl.setPermissionSNL(permissionId, permissionData);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('grantPermission', {
                permissionId,
                level: permissionEntity.level,
                grantedBy
            });

            // Return granted permission
            return this.transformToEntity({
                ...permissionEntity.toJSON(),
                id: permissionId,
                createdAt: permissionData.createdAt
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Revoke permission
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {string} namespace - Namespace (optional)
     * @param {string} entity - Entity (optional)
     * @param {string} token - Authentication token
     */
    async revokePermission(email, database, namespace, entity, token) {
        this.validateInitialized();

        try {
            // Build permission ID
            const permissionId = this.snl.buildPermissionId(email, database, namespace, entity);

            // Generate SNL command
            const snlCommand = this.snl.removePermissionSNL(permissionId);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('revokePermission', { permissionId });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get permission
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {string} namespace - Namespace (optional)
     * @param {string} entity - Entity (optional)
     * @param {string} token - Authentication token
     * @returns {Permission} Permission entity
     */
    async getPermission(email, database, namespace, entity, token) {
        this.validateInitialized();

        try {
            // Build permission ID
            const permissionId = this.snl.buildPermissionId(email, database, namespace, entity);

            // Generate SNL command
            const snlCommand = this.snl.getPermissionSNL(permissionId);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            if (!response || Object.keys(response).length === 0) {
                throw new NotFoundError(`Permission not found: ${permissionId}`);
            }

            // Parse response
            const permissionData = this.snl.parsePermission(response);

            // Transform to entity
            return this.transformToEntity(permissionData);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * List user permissions
     * @param {string} email - User email
     * @param {string} token - Authentication token
     * @returns {Permission[]} Array of permission entities
     */
    async listUserPermissions(email, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.listUserPermissionsSNL(email);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            const permissionList = this.snl.parsePermissionList(response);

            // Transform each to entity and filter active permissions
            return permissionList
                .map(data => this.transformToEntity(data))
                .filter(permission => permission.isActive());

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Check if user has permission
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {string} namespace - Namespace (optional)
     * @param {string} entity - Entity (optional)
     * @param {number} requiredLevel - Required permission level
     * @param {string} token - Authentication token
     * @returns {boolean} Has permission
     */
    async hasPermission(email, database, namespace, entity, requiredLevel, token) {
        try {
            // Check exact permission first
            try {
                const permission = await this.getPermission(email, database, namespace, entity, token);
                if (permission.isActive() && permission.level >= requiredLevel) {
                    return true;
                }
            } catch (error) {
                if (!(error instanceof NotFoundError)) {
                    throw error;
                }
            }

            // Check namespace-level permission
            if (entity && namespace) {
                try {
                    const nsPermission = await this.getPermission(email, database, namespace, null, token);
                    if (nsPermission.isActive() && nsPermission.level >= requiredLevel) {
                        return true;
                    }
                } catch (error) {
                    if (!(error instanceof NotFoundError)) {
                        throw error;
                    }
                }
            }

            // Check database-level permission
            if (namespace) {
                try {
                    const dbPermission = await this.getPermission(email, database, null, null, token);
                    if (dbPermission.isActive() && dbPermission.level >= requiredLevel) {
                        return true;
                    }
                } catch (error) {
                    if (!(error instanceof NotFoundError)) {
                        throw error;
                    }
                }
            }

            return false;

        } catch (error) {
            this.logOperation('hasPermissionError', { error: error.message });
            return false;
        }
    }

    /**
     * Update permission level
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {string} namespace - Namespace (optional)
     * @param {string} entity - Entity (optional)
     * @param {number} newLevel - New permission level
     * @param {string} updatedBy - Email of user updating permission
     * @param {string} token - Authentication token
     * @returns {Permission} Updated permission
     */
    async updatePermissionLevel(email, database, namespace, entity, newLevel, updatedBy, token) {
        this.validateInitialized();

        try {
            // Get existing permission
            const permission = await this.getPermission(email, database, namespace, entity, token);

            // Update level
            permission.level = newLevel;
            permission.grantedBy = updatedBy;
            permission.updatedAt = new Date().toISOString();

            // Grant updated permission (will overwrite)
            return await this.grantPermission(permission, updatedBy, token);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Set permission expiry
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {string} namespace - Namespace (optional)
     * @param {string} entity - Entity (optional)
     * @param {string} expiresAt - Expiry date (ISO string)
     * @param {string} token - Authentication token
     * @returns {Permission} Updated permission
     */
    async setPermissionExpiry(email, database, namespace, entity, expiresAt, token) {
        this.validateInitialized();

        try {
            // Get existing permission
            const permission = await this.getPermission(email, database, namespace, entity, token);

            // Update expiry
            permission.expiresAt = expiresAt;
            permission.updatedAt = new Date().toISOString();

            // Build permission ID
            const permissionId = this.snl.buildPermissionId(email, database, namespace, entity);

            // Transform for storage
            const permissionData = this.transformForStorage(permission);

            // Generate SNL command
            const snlCommand = this.snl.setPermissionSNL(permissionId, permissionData);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            return permission;

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate entity
     * @param {Permission} entity - Permission entity to validate
     */
    validateEntity(entity) {
        if (!entity || !(entity instanceof Permission)) {
            throw new ValidationError('Invalid permission entity');
        }

        const errors = entity.validate();
        if (errors.length > 0) {
            throw new ValidationError(`Permission validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Transform permission entity for storage
     * @param {Permission} entity - Permission entity
     * @returns {Object} Data for storage
     */
    transformForStorage(entity) {
        return this.snl.formatPermissionForStorage(entity);
    }

    /**
     * Transform response data to permission entity
     * @param {Object} data - Response data
     * @returns {Permission} Permission entity
     */
    transformToEntity(data) {
        return new Permission(data);
    }

    /**
     * Get required permission level for SNL operation
     * @param {string} operation - SNL operation
     * @returns {number} Required level
     */
    getRequiredPermissionLevel(operation) {
        return this.snl.getRequiredPermissionLevel(operation);
    }

    /**
     * Check if user has main admin permission
     * @param {Array} permissions - User permissions
     * @returns {boolean}
     */
    hasMainAdminPermission(permissions) {
        return permissions.some(p =>
            p.database === 'main' &&
            p.namespace === null &&
            p.entity === null &&
            p.level >= 3
        );
    }
}

module.exports = PermissionManager;