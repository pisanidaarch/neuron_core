// src/api/support/controllers/namespace_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const { AuthenticationError, ValidationError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * Namespace Controller for NeuronCore Support API
 */
class NamespaceController {
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
     * Validate user permissions for database operations
     * @param {string} token - JWT token
     * @param {string} database - Database name
     * @param {string} operation - Operation type (create, delete, list)
     * @returns {Promise<Object>}
     */
    async validateDatabasePermissions(token, database, operation = 'list') {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        const userInfo = await this.sender.validateToken(token);

        // Check if user has admin permissions for the database
        const isAdmin = userInfo.groups?.includes('admin') ||
                       userInfo.permissions?.some(p => p.database === database && p.level >= 3);

        // For create/delete operations, admin permissions are required
        if ((operation === 'create' || operation === 'delete') && !isAdmin) {
            throw new AuthorizationError(`Admin permissions required for ${operation} operations on database: ${database}`);
        }

        // For list operations, check if user has at least read access
        if (operation === 'list') {
            const hasAccess = isAdmin ||
                            userInfo.permissions?.some(p => p.database === database && p.level >= 1) ||
                            this.hasDefaultAccess(database, userInfo);

            if (!hasAccess) {
                throw new AuthorizationError(`No access to database: ${database}`);
            }
        }

        return userInfo;
    }

    /**
     * Check if user has default access to database
     * @param {string} database - Database name
     * @param {Object} userInfo - User information
     * @returns {boolean}
     */
    hasDefaultAccess(database, userInfo) {
        // Users have default access to their own user-data namespace
        if (database === 'user-data') {
            return true;
        }

        // Users have read access to timeline
        if (database === 'timeline') {
            return true;
        }

        return false;
    }

    /**
     * Create namespace endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createNamespace(req, res) {
        try {
            const { aiName } = req.params;
            const { database, namespace, description } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!database || !namespace) {
                throw new ValidationError('Database and namespace are required');
            }

            // Validate permissions
            await this.validateDatabasePermissions(token, database, 'create');

            // Validate namespace name
            this.validateNamespaceName(namespace);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create namespace using SNL
            const createNamespaceSNL = `set(structure)\nvalues("${namespace}", {})\non(${database}.${namespace})`;
            await this.sender.executeSNL(createNamespaceSNL, aiToken);

            res.status(201).json({
                error: false,
                message: 'Namespace created successfully',
                data: {
                    database: database,
                    namespace: namespace,
                    description: description || '',
                    created: true,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Create namespace error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to create namespace'
                });
            }
        }
    }

    /**
     * Delete namespace endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async deleteNamespace(req, res) {
        try {
            const { aiName, database, namespace } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate permissions
            await this.validateDatabasePermissions(token, database, 'delete');

            // Prevent deletion of core namespaces
            const protectedNamespaces = ['core', 'system', 'admin', 'config'];
            if (protectedNamespaces.includes(namespace)) {
                throw new ValidationError(`Cannot delete protected namespace: ${namespace}`);
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Delete namespace using SNL
            const deleteNamespaceSNL = `drop(structure)\non(${database}.${namespace})`;
            await this.sender.executeSNL(deleteNamespaceSNL, aiToken);

            res.json({
                error: false,
                message: 'Namespace deleted successfully',
                data: {
                    database: database,
                    namespace: namespace,
                    deleted: true,
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Delete namespace error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to delete namespace'
                });
            }
        }
    }

    /**
     * List namespaces endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listNamespaces(req, res) {
        try {
            const { aiName, database } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate permissions
            const userInfo = await this.validateDatabasePermissions(token, database, 'list');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // List namespaces using SNL
            const listNamespacesSNL = `list(structure)\nvalues("*")\non(${database})`;
            const response = await this.sender.executeSNL(listNamespacesSNL, aiToken);

            const namespaces = this.parseNamespacesList(response);

            // Filter namespaces based on user permissions
            const accessibleNamespaces = this.filterAccessibleNamespaces(namespaces, database, userInfo);

            res.json({
                error: false,
                data: {
                    database: database,
                    namespaces: accessibleNamespaces.map(ns => ({
                        name: ns,
                        description: this.getNamespaceDescription(database, ns),
                        type: this.getNamespaceType(database, ns),
                        accessLevel: this.getUserNamespaceAccess(database, ns, userInfo)
                    })),
                    total: accessibleNamespaces.length
                }
            });

        } catch (error) {
            console.error('List namespaces error:', error);

            if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list namespaces'
                });
            }
        }
    }

    /**
     * Validate namespace name
     * @param {string} name - Namespace name
     * @throws {ValidationError} If name is invalid
     */
    validateNamespaceName(name) {
        if (!name || typeof name !== 'string') {
            throw new ValidationError('Namespace name must be a non-empty string');
        }

        if (name.length > 50) {
            throw new ValidationError('Namespace name must be 50 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validNamePattern = /^[a-zA-Z0-9_-]+$/;
        if (!validNamePattern.test(name)) {
            throw new ValidationError('Namespace name can only contain letters, numbers, underscores, and hyphens');
        }

        // Check for reserved names
        const reservedNames = ['core', 'system', 'admin', 'config', 'temp', 'cache'];
        if (reservedNames.includes(name.toLowerCase())) {
            throw new ValidationError(`Namespace name '${name}' is reserved`);
        }
    }

    /**
     * Parse namespaces list from SNL response
     * @param {Object} response - SNL response
     * @returns {Array<string>}
     */
    parseNamespacesList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.keys(response);
    }

    /**
     * Filter namespaces based on user permissions
     * @param {Array} namespaces - All namespaces
     * @param {string} database - Database name
     * @param {Object} userInfo - User information
     * @returns {Array} Filtered namespaces
     */
    filterAccessibleNamespaces(namespaces, database, userInfo) {
        // Admins can see all namespaces
        if (userInfo.groups?.includes('admin')) {
            return namespaces;
        }

        // For user-data database, users can only see their own namespace
        if (database === 'user-data') {
            const userNamespace = userInfo.email ? userInfo.email.replace(/[@.]/g, '_') : userInfo.username;
            return namespaces.filter(ns => ns === userNamespace || ns === 'core');
        }

        // For other databases, filter based on permissions
        return namespaces.filter(ns => {
            // Always show core namespace
            if (ns === 'core') return true;

            // Check if user has specific permission for this namespace
            return userInfo.permissions?.some(p =>
                p.database === database && (p.namespace === ns || p.namespace === '*')
            );
        });
    }

    /**
     * Get namespace description
     * @param {string} database - Database name
     * @param {string} namespace - Namespace name
     * @returns {string} Description
     */
    getNamespaceDescription(database, namespace) {
        const descriptions = {
            'core': 'Core system namespace containing essential entities',
            'commands': 'Command definitions and configurations',
            'workflows': 'Workflow definitions and templates',
            'settings': 'Application settings and configurations',
            'data': 'User data storage',
            'temp': 'Temporary data storage',
            'logs': 'System and user activity logs'
        };

        return descriptions[namespace] || 'User-defined namespace';
    }

    /**
     * Get namespace type
     * @param {string} database - Database name
     * @param {string} namespace - Namespace name
     * @returns {string} Type
     */
    getNamespaceType(database, namespace) {
        const systemNamespaces = ['core', 'system', 'admin'];
        const configNamespaces = ['settings', 'config'];

        if (systemNamespaces.includes(namespace)) {
            return 'system';
        } else if (configNamespaces.includes(namespace)) {
            return 'config';
        } else {
            return 'user';
        }
    }

    /**
     * Get user access level for namespace
     * @param {string} database - Database name
     * @param {string} namespace - Namespace name
     * @param {Object} userInfo - User information
     * @returns {string} Access level
     */
    getUserNamespaceAccess(database, namespace, userInfo) {
        // Check if user is admin
        if (userInfo.groups?.includes('admin')) {
            return 'admin';
        }

        // For user-data database, users have admin access to their own namespace
        if (database === 'user-data') {
            const userNamespace = userInfo.email ? userInfo.email.replace(/[@.]/g, '_') : userInfo.username;
            if (namespace === userNamespace) {
                return 'admin';
            }
        }

        // Check specific permissions
        if (userInfo.permissions) {
            const permission = userInfo.permissions.find(p =>
                p.database === database && (p.namespace === namespace || p.namespace === '*')
            );
            if (permission) {
                if (permission.level >= 3) return 'admin';
                if (permission.level >= 2) return 'write';
                return 'read';
            }
        }

        return 'read';
    }
}

module.exports = NamespaceController;