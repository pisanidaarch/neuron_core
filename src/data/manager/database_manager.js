// src/data/manager/database_manager.js

const DatabaseSNL = require('../snl/database_snl');
const DatabaseInfo = require('../../cross/entity/database_info');
const NamespaceInfo = require('../../cross/entity/namespace_info');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Database Manager - Manages database and namespace operations
 */
class DatabaseManager {
    constructor() {
        this.snl = new DatabaseSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * Create database
     */
    async createDatabase(name, userEmail, token) {
        try {
            this.snl.validateDatabaseName(name);

            const response = await this.sender.createDatabase(token, name);

            return {
                success: true,
                database: name,
                createdBy: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to create database: ${error.message}`);
        }
    }

    /**
     * List databases
     */
    async listDatabases(token) {
        try {
            const response = await this.sender.listDatabases(token);
            const databases = this.snl.parseDatabaseList(response);

            return databases.map(db => new DatabaseInfo({
                name: db,
                description: '',
                createdAt: new Date().toISOString()
            }));

        } catch (error) {
            throw new NeuronDBError(`Failed to list databases: ${error.message}`);
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(name, token) {
        try {
            this.snl.validateDatabaseName(name);

            const response = await this.sender.dropDatabase(token, name);

            return {
                success: true,
                database: name,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to drop database: ${error.message}`);
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(database, namespace, userEmail, token) {
        try {
            this.snl.validateDatabaseName(database);
            this.snl.validateNamespaceName(namespace);

            const response = await this.sender.createNamespace(token, database, namespace);

            return {
                success: true,
                database: database,
                namespace: namespace,
                createdBy: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to create namespace: ${error.message}`);
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(database, token) {
        try {
            this.snl.validateDatabaseName(database);

            const response = await this.sender.listNamespaces(token, database);
            const namespaces = this.snl.parseNamespaceList(response);

            return namespaces.map(ns => new NamespaceInfo({
                name: ns,
                database: database,
                description: '',
                createdAt: new Date().toISOString()
            }));

        } catch (error) {
            throw new NeuronDBError(`Failed to list namespaces: ${error.message}`);
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(database, namespace, token) {
        try {
            this.snl.validateDatabaseName(database);
            this.snl.validateNamespaceName(namespace);

            const response = await this.sender.dropNamespace(token, database, namespace);

            return {
                success: true,
                database: database,
                namespace: namespace,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to drop namespace: ${error.message}`);
        }
    }

    /**
     * Check if user has admin permission on database
     */
    hasAdminPermission(database, permissions) {
        const permission = permissions.find(p => p.database === database);
        return permission && permission.level >= 3; // admin level
    }

    /**
     * Check if user has admin permission on main database
     */
    hasMainAdminPermission(permissions) {
        return this.hasAdminPermission('main', permissions);
    }
}

module.exports = DatabaseManager;

// src/data/manager/user_data_manager.js

const UserDataSNL = require('../snl/user_data_snl');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * User Data Manager - Manages user personal data storage
 */
class UserDataManager {
    constructor() {
        this.snl = new UserDataSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Store pointer data
     */
    async storePointer(userEmail, name, content, token) {
        try {
            this.snl.validateUserDataName(name);

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storePointerSNL(userEmail, name, content);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'pointer',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store pointer: ${error.message}`);
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(userEmail, name, data, token) {
        try {
            this.snl.validateUserDataName(name);

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storeStructureSNL(userEmail, name, data);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'structure',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store structure: ${error.message}`);
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(userEmail, name, values, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!Array.isArray(values) || values.length === 0) {
                throw new Error('Values array is required for enum');
            }

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storeEnumSNL(userEmail, name, values);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'enum',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store enum: ${error.message}`);
        }
    }

    /**
     * Get user data
     */
    async getUserData(userEmail, dataType, name, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const getSNL = this.snl.getUserDataSNL(userEmail, dataType, name);
            const response = await this.sender.executeSNL(getSNL, token);

            return this.snl.parseUserData(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to get user data: ${error.message}`);
        }
    }

    /**
     * List user data
     */
    async listUserData(userEmail, dataType = null, pattern = '*', token) {
        try {
            if (dataType && !['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const listSNL = this.snl.listUserDataSNL(userEmail, dataType, pattern);
            const response = await this.sender.executeSNL(listSNL, token);

            return this.snl.parseUserDataList(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to list user data: ${error.message}`);
        }
    }

    /**
     * Delete user data
     */
    async deleteUserData(userEmail, dataType, name, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const deleteSNL = this.snl.deleteUserDataSNL(userEmail, dataType, name);
            const response = await this.sender.executeSNL(deleteSNL, token);

            return {
                success: true,
                type: dataType,
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to delete user data: ${error.message}`);
        }
    }

    /**
     * Ensure user data namespace exists
     */
    async _ensureUserDataNamespace(userEmail, token) {
        try {
            const checkSNL = this.snl.checkUserDataNamespaceSNL(userEmail);
            const response = await this.sender.executeSNL(checkSNL, token);

            const namespace = this.snl.formatEmailForNamespace(userEmail);
            if (!response || (Array.isArray(response) && !response.includes(namespace))) {
                // Create namespace via sender
                await this.sender.createNamespace(token, 'user-data', namespace);

                // Set permissions for user
                await this.sender.setPermission(token, userEmail, 'user-data', 2); // write permission
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure user data namespace:', error.message);
        }
    }
}

module.exports = UserDataManager;

// src/data/neuron_db/config_sender.js

const NeuronDBSender = require('./sender');
const config = require('../../cross/entity/config');

/**
 * Config Sender - NeuronDB sender for configuration database
 */
class ConfigSender extends NeuronDBSender {
    constructor() {
        super(config.get('neuronDB.url'));
        this.configToken = config.get('neuronDB.configToken');
    }

    /**
     * Execute SNL with config token
     */
    async executeSNLWithConfigToken(snlCommand) {
        return await this.executeSNL(snlCommand, this.configToken);
    }

    /**
     * Get config token
     */
    getConfigToken() {
        return this.configToken;
    }

    /**
     * Update config token
     */
    updateConfigToken(newToken) {
        this.configToken = newToken;
    }
}

module.exports = ConfigSender;

// src/data/neuron_db/ai_sender.js

const NeuronDBSender = require('./sender');
const config = require('../../cross/entity/config');
const KeysVO = require('../../cross/entity/keys_vo');

/**
 * AI Sender - NeuronDB sender for specific AI instance
 */
class AISender extends NeuronDBSender {
    constructor(aiName) {
        super(config.get('neuronDB.url'));
        this.aiName = aiName;
        this.aiToken = null;
        this._initializeToken();
    }

    /**
     * Initialize AI token from KeysVO
     */
    _initializeToken() {
        try {
            const keysVO = KeysVO.getInstance();
            this.aiToken = keysVO.getAIToken(this.aiName);

            if (!this.aiToken) {
                console.warn(`No token found for AI: ${this.aiName}`);
            }
        } catch (error) {
            console.error(`Failed to initialize token for AI ${this.aiName}:`, error);
        }
    }

    /**
     * Execute SNL with AI token
     */
    async executeSNLWithAIToken(snlCommand) {
        if (!this.aiToken) {
            this._initializeToken();
        }

        if (!this.aiToken) {
            throw new Error(`No token available for AI: ${this.aiName}`);
        }

        return await this.executeSNL(snlCommand, this.aiToken);
    }

    /**
     * Get AI token
     */
    getAIToken() {
        return this.aiToken;
    }

    /**
     * Update AI token
     */
    updateAIToken(newToken) {
        this.aiToken = newToken;
    }

    /**
     * Get AI name
     */
    getAIName() {
        return this.aiName;
    }

    /**
     * Refresh token from KeysVO
     */
    refreshToken() {
        this._initializeToken();
    }

    /**
     * Execute SNL with user token (for user-specific operations)
     */
    async executeSNLWithUserToken(snlCommand, userToken) {
        return await this.executeSNL(snlCommand, userToken);
    }

    /**
     * Execute SNL automatically choosing appropriate token
     */
    async executeSNL(snlCommand, token = null) {
        // If no token provided, use AI token
        const useToken = token || this.aiToken;

        if (!useToken) {
            throw new Error(`No token available for SNL execution`);
        }

        return await super.executeSNL(snlCommand, useToken);
    }
}

module.exports = AISender;

// src/data/manager/snl_manager.js

const SNLRequest = require('../../cross/entity/snl_request');
const SNLResponse = require('../../cross/entity/snl_response');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * SNL Manager - Manages direct SNL execution
 */
class SNLManager {
    constructor() {
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * Execute SNL command
     */
    async executeSNL(snlRequest, token) {
        try {
            // Validate request
            const errors = snlRequest.validate();
            if (errors.length > 0) {
                throw new Error(`SNL request validation failed: ${errors.join(', ')}`);
            }

            const startTime = Date.now();
            const response = await this.sender.executeSNL(snlRequest.command, token);
            const executionTime = Date.now() - startTime;

            const snlResponse = new SNLResponse();
            snlResponse.setSuccess(response, executionTime);

            return snlResponse;

        } catch (error) {
            const snlResponse = new SNLResponse();
            snlResponse.setError(error.message);
            throw new NeuronDBError(`SNL execution failed: ${error.message}`);
        }
    }

    /**
     * Validate SNL command syntax (basic validation)
     */
    validateSNLCommand(command) {
        const errors = [];

        if (!command || typeof command !== 'string') {
            errors.push('SNL command must be a string');
            return errors;
        }

        const lines = command.trim().split('\n');
        if (lines.length < 2) {
            errors.push('SNL command must have at least operation and on clauses');
            return errors;
        }

        // Check for operation line
        const operationLine = lines.find(line =>
            line.trim().match(/^(set|view|list|remove|drop|search|match|tag|untag|audit)\(/));

        if (!operationLine) {
            errors.push('SNL command must contain a valid operation (set, view, list, remove, drop, search, match, tag, untag, audit)');
        }

        // Check for on clause
        const onLine = lines.find(line => line.trim().startsWith('on('));
        if (!onLine) {
            errors.push('SNL command must contain an "on" clause');
        }

        return errors;
    }

    /**
     * Parse SNL operation type
     */
    parseSNLOperation(command) {
        const operationMatch = command.match(/^(set|view|list|remove|drop|search|match|tag|untag|audit)\(/m);
        return operationMatch ? operationMatch[1] : null;
    }

    /**
     * Parse SNL target path
     */
    parseSNLPath(command) {
        const onMatch = command.match(/on\(([^)]*)\)/);
        if (!onMatch) return null;

        const path = onMatch[1].trim();
        if (!path) return { database: null, namespace: null, entity: null };

        const parts = path.split('.');
        return {
            database: parts[0] || null,
            namespace: parts[1] || null,
            entity: parts[2] || null
        };
    }

    /**
     * Check if operation requires specific permissions
     */
    getRequiredPermissionLevel(operation) {
        const readOperations = ['view', 'list', 'search', 'match'];
        const writeOperations = ['set', 'remove', 'tag', 'untag'];
        const adminOperations = ['drop'];

        if (readOperations.includes(operation)) return 1;
        if (writeOperations.includes(operation)) return 2;
        if (adminOperations.includes(operation)) return 3;

        return 2; // default to write permission
    }
}

module.exports = SNLManager;