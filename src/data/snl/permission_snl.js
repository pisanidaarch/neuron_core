// src/data/snl/permission_snl.js

const BaseSNL = require('./base_snl');

/**
 * Permission SNL - Generates SNL commands for permission operations
 */
class PermissionSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'main';
        this.namespace = 'core';
        this.entity = 'permissions';
    }

    /**
     * Get permission by ID
     */
    getPermissionSNL(permissionId) {
        const path = this.buildPath(this.database, this.namespace, this.entity, permissionId);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set permission
     */
    setPermissionSNL(permissionId, permissionData) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        const values = [permissionId, permissionData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * List permissions for a user
     */
    listUserPermissionsSNL(email) {
        const pattern = `${email}:*`;
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * List all permissions
     */
    listAllPermissionsSNL(pattern = '*') {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search permissions
     */
    searchPermissionsSNL(searchTerm) {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove permission
     */
    removePermissionSNL(permissionId) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('remove', 'structure', permissionId, path);
    }

    /**
     * Drop all permissions (admin only)
     */
    dropPermissionsSNL() {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('drop', 'structure', null, path);
    }

    /**
     * Get user permissions count (for auditing)
     */
    getUserPermissionsCountSNL() {
        const path = this.buildPath(this.database, this.namespace, 'permission_stats');
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Build permission ID from components
     */
    buildPermissionId(email, database, namespace = null, entity = null) {
        const scopeParts = [database];
        if (namespace) scopeParts.push(namespace);
        if (entity) scopeParts.push(entity);

        const scope = scopeParts.join('.');
        return `${email}:${scope}`;
    }

    /**
     * Parse permission ID
     */
    parsePermissionId(permissionId) {
        const [email, scope] = permissionId.split(':');
        const scopeParts = scope.split('.');

        return {
            email,
            database: scopeParts[0] || null,
            namespace: scopeParts[1] || null,
            entity: scopeParts[2] || null
        };
    }

    /**
     * Parse permission from response
     */
    parsePermission(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const ids = Object.keys(response);
        if (ids.length === 0) {
            return null;
        }

        const permissionId = ids[0];
        const permissionData = response[permissionId];
        const idComponents = this.parsePermissionId(permissionId);

        return {
            ...idComponents,
            ...permissionData,
            id: permissionId
        };
    }

    /**
     * Parse permission list from response
     */
    parsePermissionList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([permissionId, permissionData]) => {
            const idComponents = this.parsePermissionId(permissionId);
            return {
                ...idComponents,
                ...permissionData,
                id: permissionId
            };
        });
    }

    /**
     * Validate permission data
     */
    validatePermissionData(permissionData) {
        const required = ['level'];
        const missing = required.filter(field => !permissionData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required permission fields: ${missing.join(', ')}`);
        }

        if (!Number.isInteger(permissionData.level) ||
            permissionData.level < 1 ||
            permissionData.level > 3) {
            throw new Error('Permission level must be 1, 2, or 3');
        }

        return true;
    }

    /**
     * Format permission for storage
     */
    formatPermissionForStorage(permission) {
        return {
            level: permission.level,
            grantedBy: permission.grantedBy || 'system',
            expiresAt: permission.expiresAt || null,
            metadata: permission.metadata || {},
            createdAt: permission.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Get permission level required for SNL operation
     */
    getRequiredPermissionLevel(operation) {
        const operationLevels = {
            'view': 1,    // read
            'list': 1,    // read
            'search': 1,  // read
            'match': 1,   // read
            'set': 2,     // write
            'tag': 2,     // write
            'untag': 2,   // write
            'remove': 3,  // admin
            'drop': 3,    // admin
            'audit': 1    // read (but may be restricted by content)
        };

        return operationLevels[operation.toLowerCase()] || 3; // Default to admin
    }
}

module.exports = PermissionSNL;