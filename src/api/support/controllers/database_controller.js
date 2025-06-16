// src/api/support/controllers/database_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const { AuthenticationError, ValidationError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * Database Controller for NeuronCore Support API
 */
class DatabaseController {
    constructor() {
        this.sender = new AISender();
    }

    /**
     * Get AI token for operations
     * @param {string} aiName - AI name
     * @returns {Promise<string>}
     */
    async getAIToken(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        return keysVO.getAIToken(aiName);
    }

    /**
     * Validate admin permissions (only admins can manage databases)
     * @param {string} token - JWT token
     * @returns {Promise<Object>}
     */
    async validateAdminPermissions(token) {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        const userInfo = await this.sender.validateToken(token);

        // Check if user has admin permissions
        const isAdmin = userInfo.groups?.includes('admin') ||
                       userInfo.permissions?.some(p => p.database === 'main' && p.level >= 3);

        if (!isAdmin) {
            throw new AuthorizationError('Admin permissions required for database operations');
        }

        return userInfo;
    }

    /**
     * Create database endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createDatabase(req, res) {
        try {
            const { aiName } = req.params;
            const { name, description } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            if (!name || typeof name !== 'string') {
                throw new ValidationError('Database name is required');
            }

            // Validate database name
            this.validateDatabaseName(name);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create database
            await this.sender.createDatabase(aiToken, name);

            res.status(201).json({
                error: false,
                message: 'Database created successfully',
                data: {
                    name: name,
                    description: description || '',
                    created: true,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Create database error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to create database'
                });
            }
        }
    }

    /**
     * Delete database endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async deleteDatabase(req, res) {
        try {
            const { aiName, databaseName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            // Prevent deletion of core databases
            const protectedDatabases = ['main', 'config', 'system'];
            if (protectedDatabases.includes(databaseName)) {
                throw new ValidationError(`Cannot delete protected database: ${databaseName}`);
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Delete database
            await this.sender.deleteDatabase(aiToken, databaseName);

            res.json({
                error: false,
                message: 'Database deleted successfully',
                data: {
                    name: databaseName,
                    deleted: true,
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Delete database error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to delete database'
                });
            }
        }
    }

    /**
     * List databases endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listDatabases(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token (any authenticated user can list databases they have access to)
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // List databases
            const databases = await this.sender.listDatabases(aiToken);

            // Filter databases based on user permissions
            const accessibleDatabases = this.filterAccessibleDatabases(databases, userInfo);

            res.json({
                error: false,
                data: {
                    databases: accessibleDatabases.map(db => ({
                        name: db,
                        description: this.getDatabaseDescription(db),
                        type: this.getDatabaseType(db),
                        accessLevel: this.getUserAccessLevel(db, userInfo)
                    })),
                    total: accessibleDatabases.length,
                    user: userInfo.username
                }
            });

        } catch (error) {
            console.error('List databases error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list databases'
                });
            }
        }
    }

    /**
     * Validate database name
     * @param {string} name - Database name
     * @throws {ValidationError} If name is invalid
     */
    validateDatabaseName(name) {
        if (!name || typeof name !== 'string') {
            throw new ValidationError('Database name must be a non-empty string');
        }

        if (name.length > 50) {
            throw new ValidationError('Database name must be 50 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!validNamePattern.test(name)) {
            throw new ValidationError('Database name can only contain letters, numbers, underscores, and hyphens');
        }

        // Check for reserved names
        const reservedNames = ['main', 'config', 'system', 'admin', 'root', 'temp', 'cache'];
        if (reservedNames.includes(name.toLowerCase())) {
            throw new ValidationError(`Database name '${name}' is reserved`);
        }
    }

    /**
     * Filter databases based on user permissions
     * @param {Array} databases - All databases
     * @param {Object} userInfo - User information
     * @returns {Array} Filtered databases
     */
    filterAccessibleDatabases(databases, userInfo) {
        // Admins can see all databases
        if (userInfo.groups?.includes('admin')) {
            return databases;
        }

        // Regular users can only see certain databases
        const allowedDatabases = ['workflow', 'timeline', 'user-data'];

        // Add databases from user permissions
        if (userInfo.permissions) {
            userInfo.permissions.forEach(permission => {
                if (permission.database && !allowedDatabases.includes(permission.database)) {
                    allowedDatabases.push(permission.database);
                }
            });
        }

        return databases.filter(db => allowedDatabases.includes(db));
    }

    /**
     * Get database description
     * @param {string} databaseName - Database name
     * @returns {string} Description
     */
    getDatabaseDescription(databaseName) {
        const descriptions = {
            'main': 'Core system database containing users, groups, and permissions',
            'workflow': 'Workflow definitions and execution history',
            'timeline': 'User activity timeline and audit logs',
            'user-data': 'User personal data and preferences',
            'workflow-ris': 'Workflow RIS data and processing results',
            'config-app': 'Application configuration and settings',
            'temp-storage': 'Temporary storage for workflow processing'
        };

        return descriptions[databaseName] || 'User-defined database';
    }

    /**
     * Get database type
     * @param {string} databaseName - Database name
     * @returns {string} Type
     */
    getDatabaseType(databaseName) {
        const systemDatabases = ['main', 'config', 'system'];
        const coreDatabases = ['workflow', 'timeline', 'user-data'];

        if (systemDatabases.includes(databaseName)) {
            return 'system';
        } else if (coreDatabases.includes(databaseName)) {
            return 'core';
        } else {
            return 'user';
        }
    }

    /**
     * Get user access level for database
     * @param {string} databaseName - Database name
     * @param {Object} userInfo - User information
     * @returns {string} Access level
     */
    getUserAccessLevel(databaseName, userInfo) {
        // Check if user is admin
        if (userInfo.groups?.includes('admin')) {
            return 'admin';
        }

        // Check specific permissions
        if (userInfo.permissions) {
            const permission = userInfo.permissions.find(p => p.database === databaseName);
            if (permission) {
                if (permission.level >= 3) return 'admin';
                if (permission.level >= 2) return 'write';
                return 'read';
            }
        }

        // Default access levels
        const defaultReadAccess = ['timeline', 'user-data'];
        if (defaultReadAccess.includes(databaseName)) {
            return 'read';
        }

        return 'none';
    }
}

module.exports = DatabaseController;