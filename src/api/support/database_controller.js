// src/api/support/database_controller.js

const DatabaseService = require('../../core/support/database_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * Database Controller - HTTP layer for database operations
 */
class DatabaseController {
    constructor() {
        this.service = new DatabaseService();
    }

    /**
     * Create database
     */
    async createDatabase(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name } = body;

            if (!name) {
                return res.status(400).json({
                    error: true,
                    message: 'Database name is required'
                });
            }

            const result = await this.service.createDatabase(
                name,
                user.permissions,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Database created successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * List databases
     */
    async listDatabases(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.listDatabases(
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { name } = params;

            const result = await this.service.dropDatabase(
                name,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Database dropped successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(req, res) {
        try {
            const { params, body, user, token } = this._extractRequestData(req);
            const { db } = params;
            const { name } = body;

            if (!name) {
                return res.status(400).json({
                    error: true,
                    message: 'Namespace name is required'
                });
            }

            const result = await this.service.createNamespace(
                db,
                name,
                user.permissions,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Namespace created successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { db } = params;

            const result = await this.service.listNamespaces(
                db,
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { db, name } = params;

            const result = await this.service.dropNamespace(
                db,
                name,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Namespace dropped successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Database Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = DatabaseController;

// src/api/support/user_data_controller.js

const UserDataService = require('../../core/support/user_data_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * User Data Controller - HTTP layer for user data operations
 */
class UserDataController {
    constructor(aiName) {
        this.service = new UserDataService(aiName);
    }

    /**
     * Store pointer data
     */
    async storePointer(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, content } = body;

            if (!name || !content) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and content are required'
                });
            }

            const result = await this.service.storePointer(
                name,
                content,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Pointer stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, data } = body;

            if (!name || !data) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and data are required'
                });
            }

            const result = await this.service.storeStructure(
                name,
                data,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Structure stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, values } = body;

            if (!name || !values) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and values are required'
                });
            }

            const result = await this.service.storeEnum(
                name,
                values,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Enum stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get user data
     */
    async getUserData(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { type, name } = params;

            const result = await this.service.getUserData(
                type,
                name,
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * List user data
     */
    async listUserData(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { type, pattern } = query;

            const result = await this.service.listUserData(
                type,
                pattern,
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Delete user data
     */
    async deleteUserData(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { type, name } = params;

            const result = await this.service.deleteUserData(
                type,
                name,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'User data deleted successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('User Data Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = UserDataController;

// src/api/support/snl_controller.js

const SNLService = require('../../core/support/snl_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * SNL Controller - HTTP layer for SNL operations
 */
class SNLController {
    constructor(aiName) {
        this.service = new SNLService(aiName);
    }

    /**
     * Execute SNL command
     */
    async executeSNL(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            // Support both JSON and plain text
            let command;
            if (typeof body === 'string') {
                command = body;
            } else if (body.command) {
                command = body.command;
            } else {
                return res.status(400).json({
                    error: true,
                    message: 'SNL command is required'
                });
            }

            const result = await this.service.executeSNL(
                command,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('SNL Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = SNLController;

// src/api/support/support_api.js

const express = require('express');
const createSupportRoutes = require('./routes');
const { getInstance } = require('../../data/manager/keys_vo_manager');

/**
 * Support API Setup
 */
class SupportAPI {
    constructor() {
        this.router = express.Router();
    }

    /**
     * Initialize support API for specific AI
     */
    initialize(aiName) {
        // Add AI-specific support routes
        const supportRoutes = createSupportRoutes(aiName);
        this.router.use(`/${aiName}/support`, supportRoutes);

        return this.router;
    }

    /**
     * Initialize support APIs for all available AIs
     */
    async initializeAll() {
        try {
            // Get all available AIs from KeysVO
            const keysVOManager = getInstance();
            const keysVO = await keysVOManager.getKeysVO();
            const aiNames = keysVO.getAINames();

            // Initialize routes for each AI
            for (const aiName of aiNames) {
                const supportRoutes = createSupportRoutes(aiName);
                this.router.use(`/${aiName}/support`, supportRoutes);
                console.log(`Support API initialized for AI: ${aiName}`);
            }

            return this.router;

        } catch (error) {
            console.error('Failed to initialize Support APIs:', error);
            throw error;
        }
    }

    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = SupportAPI;

// src/core/support/initialization_service.js

const AISender = require('../../data/neuron_db/ai_sender');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { getInstance } = require('../../data/manager/keys_vo_manager');

/**
 * Initialization Service - Initialize support module databases and namespaces
 */
class InitializationService {
    constructor() {
        this.sender = new NeuronDBSender();
    }

    /**
     * Initialize support databases for AI
     */
    async initializeSupportDatabases(aiName) {
        try {
            console.log(`Initializing support databases for AI: ${aiName}`);

            // Get AI token
            const keysVOManager = getInstance();
            const keysVO = await keysVOManager.getKeysVO();
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiToken) {
                throw new Error(`No token found for AI: ${aiName}`);
            }

            // Initialize timeline database
            await this._initializeTimelineDatabase(aiToken);

            // Initialize user-data database
            await this._initializeUserDataDatabase(aiToken);

            console.log(`Support databases initialized successfully for AI: ${aiName}`);

        } catch (error) {
            console.error(`Failed to initialize support databases for AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize user namespaces
     */
    async initializeUserNamespaces(aiName, userEmail) {
        try {
            console.log(`Initializing user namespaces for ${userEmail} in AI: ${aiName}`);

            // Get AI token
            const keysVOManager = getInstance();
            const keysVO = await keysVOManager.getKeysVO();
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiToken) {
                throw new Error(`No token found for AI: ${aiName}`);
            }

            const formattedEmail = this._formatEmailForNamespace(userEmail);

            // Create timeline namespace
            await this._createNamespaceIfNotExists('timeline', formattedEmail, aiToken);

            // Create user-data namespace
            await this._createNamespaceIfNotExists('user-data', formattedEmail, aiToken);

            // Set permissions
            await this._setUserPermissions(userEmail, aiToken);

            console.log(`User namespaces initialized successfully for ${userEmail}`);

        } catch (error) {
            console.error(`Failed to initialize user namespaces for ${userEmail}:`, error);
            // Don't throw - this shouldn't block user operations
        }
    }

    /**
     * Initialize timeline database
     */
    async _initializeTimelineDatabase(token) {
        try {
            // Check if timeline database exists
            const databases = await this.sender.listDatabases(token);
            const dbExists = Array.isArray(databases) && databases.includes('timeline');

            if (!dbExists) {
                await this.sender.createDatabase(token, 'timeline');
                console.log('Timeline database created');
            }

        } catch (error) {
            console.warn('Timeline database initialization warning:', error.message);
        }
    }

    /**
     * Initialize user-data database
     */
    async _initializeUserDataDatabase(token) {
        try {
            // Check if user-data database exists
            const databases = await this.sender.listDatabases(token);
            const dbExists = Array.isArray(databases) && databases.includes('user-data');

            if (!dbExists) {
                await this.sender.createDatabase(token, 'user-data');
                console.log('User-data database created');
            }

        } catch (error) {
            console.warn('User-data database initialization warning:', error.message);
        }
    }

    /**
     * Create namespace if it doesn't exist
     */
    async _createNamespaceIfNotExists(database, namespace, token) {
        try {
            // List existing namespaces
            const namespaces = await this.sender.listNamespaces(token, database);
            const nsExists = Array.isArray(namespaces) && namespaces.includes(namespace);

            if (!nsExists) {
                await this.sender.createNamespace(token, database, namespace);
                console.log(`Namespace ${database}.${namespace} created`);
            }

        } catch (error) {
            console.warn(`Namespace creation warning for ${database}.${namespace}:`, error.message);
        }
    }

    /**
     * Set user permissions
     */
    async _setUserPermissions(userEmail, token) {
        try {
            // Set timeline permission (level 2 = read/write)
            await this.sender.setPermission(token, userEmail, 'timeline', 2);

            // Set user-data permission (level 2 = read/write)
            await this.sender.setPermission(token, userEmail, 'user-data', 2);

        } catch (error) {
            console.warn(`Permission setting warning for ${userEmail}:`, error.message);
        }
    }

    /**
     * Format email for namespace
     */
    _formatEmailForNamespace(email) {
        return email.replace(/\./g, '_').replace('@', '_at_');
    }
}

module.exports = InitializationService;

// src/core/support/index.js

const CommandService = require('./command_service');
const TimelineService = require('./timeline_service');
const ConfigService = require('./config_service');
const TagService = require('./tag_service');
const DatabaseService = require('./database_service');
const UserDataService = require('./user_data_service');
const SNLService = require('./snl_service');
const InitializationService = require('./initialization_service');

/**
 * Support Module - Main entry point
 */
class SupportModule {
    constructor(aiName) {
        this.aiName = aiName;
        this.services = {
            command: new CommandService(aiName),
            timeline: new TimelineService(aiName),
            config: new ConfigService(aiName),
            tag: new TagService(aiName),
            database: new DatabaseService(),
            userData: new UserDataService(aiName),
            snl: new SNLService(aiName)
        };
        this.initialization = new InitializationService();
    }

    /**
     * Initialize support module
     */
    async initialize() {
        try {
            await this.initialization.initializeSupportDatabases(this.aiName);
            console.log(`Support module initialized for AI: ${this.aiName}`);
        } catch (error) {
            console.error(`Failed to initialize support module for AI ${this.aiName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize user-specific resources
     */
    async initializeUser(userEmail) {
        try {
            await this.initialization.initializeUserNamespaces(this.aiName, userEmail);
        } catch (error) {
            console.warn(`User initialization warning for ${userEmail}:`, error);
            // Don't throw - this shouldn't block user operations
        }
    }

    /**
     * Get service by name
     */
    getService(serviceName) {
        return this.services[serviceName];
    }

    /**
     * Get all services
     */
    getServices() {
        return this.services;
    }
}

module.exports = SupportModule;