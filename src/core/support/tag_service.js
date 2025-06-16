// src/core/support/tag_service.js

const TagManager = require('../../data/manager/tag_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const TagInfo = require('../../cross/entity/tag_info');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Tag Service - Business logic for tag operations
 */
class TagService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new TagManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Add tag to entity
     */
    async addTag(database, namespace, entity, tag, userPermissions, userEmail, token) {
        try {
            // Validate inputs
            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Check permissions
            const canModify = await this.manager.canModifyTag(database, namespace, userEmail, userPermissions);
            if (!canModify) {
                throw new AuthorizationError(`Insufficient permissions to add tag to ${database}.${namespace}.${entity}`);
            }

            const result = await this.manager.addTag(database, namespace, entity, tag, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(database, namespace, entity, tag, userPermissions, userEmail, token) {
        try {
            // Validate inputs
            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Check permissions
            const canModify = await this.manager.canModifyTag(database, namespace, userEmail, userPermissions);
            if (!canModify) {
                throw new AuthorizationError(`Insufficient permissions to remove tag from ${database}.${namespace}.${entity}`);
            }

            const result = await this.manager.removeTag(database, namespace, entity, tag, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List tags
     */
    async listTags(database = null, pattern = '*', userPermissions, token) {
        try {
            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to list tags in ${database}`);
                }
            }

            const tags = await this.manager.listTags(database, pattern, token);

            return {
                database,
                pattern,
                tags,
                count: tags.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Match tags by patterns
     */
    async matchTags(patterns, database = null, userPermissions, token) {
        try {
            if (!Array.isArray(patterns) || patterns.length === 0) {
                throw new ValidationError('At least one pattern is required');
            }

            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to search tags in ${database}`);
                }
            }

            const matches = await this.manager.matchTags(patterns, database, token);

            return {
                patterns,
                database,
                matches,
                count: matches.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * View tag content
     */
    async viewTag(tag, database = null, userPermissions, token) {
        try {
            if (!tag) {
                throw new ValidationError('Tag name is required');
            }

            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to view tags in ${database}`);
                }
            }

            const entities = await this.manager.viewTag(tag, database, token);

            return {
                tag,
                database,
                entities,
                count: entities.length
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = TagService;

// src/core/support/database_service.js

const DatabaseManager = require('../../data/manager/database_manager');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Database Service - Business logic for database operations
 */
class DatabaseService {
    constructor() {
        this.manager = new DatabaseManager();
        this.sender = new NeuronDBSender();
        this.manager.initialize(this.sender);
    }

    /**
     * Create database
     */
    async createDatabase(name, userPermissions, userEmail, token) {
        try {
            // Validate user has main admin permissions
            if (!this.manager.hasMainAdminPermission(userPermissions)) {
                throw new AuthorizationError('Main admin permissions required to create database');
            }

            const result = await this.manager.createDatabase(name, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List databases
     */
    async listDatabases(userPermissions, token) {
        try {
            const databases = await this.manager.listDatabases(token);

            // Filter databases based on user permissions
            const accessibleDatabases = databases.filter(db => {
                const hasPermission = userPermissions.some(p => p.database === db.name);
                return hasPermission || db.name === 'user-data'; // Always include user-data
            });

            return {
                databases: accessibleDatabases,
                count: accessibleDatabases.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(name, userPermissions, userEmail, token) {
        try {
            // Validate user has main admin permissions
            if (!this.manager.hasMainAdminPermission(userPermissions)) {
                throw new AuthorizationError('Main admin permissions required to drop database');
            }

            // Prevent dropping critical databases
            const protectedDatabases = ['main', 'config', 'timeline', 'user-data'];
            if (protectedDatabases.includes(name)) {
                throw new ValidationError(`Cannot drop protected database: ${name}`);
            }

            const result = await this.manager.dropDatabase(name, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(database, namespace, userPermissions, userEmail, token) {
        try {
            // Validate user has admin permissions on the database
            if (!this.manager.hasAdminPermission(database, userPermissions)) {
                throw new AuthorizationError(`Admin permissions required on database ${database} to create namespace`);
            }

            const result = await this.manager.createNamespace(database, namespace, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(database, userPermissions, token) {
        try {
            // Check user has access to database
            const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
            if (!hasPermission) {
                throw new AuthorizationError(`Insufficient permissions to list namespaces in ${database}`);
            }

            const namespaces = await this.manager.listNamespaces(database, token);

            return {
                database,
                namespaces,
                count: namespaces.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(database, namespace, userPermissions, userEmail, token) {
        try {
            // Validate user has admin permissions on the database
            if (!this.manager.hasAdminPermission(database, userPermissions)) {
                throw new AuthorizationError(`Admin permissions required on database ${database} to drop namespace`);
            }

            // Prevent dropping user data namespaces
            if (database === 'user-data' && namespace.includes('_at_')) {
                throw new ValidationError('Cannot drop user data namespaces');
            }

            const result = await this.manager.dropNamespace(database, namespace, token);

            return result;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = DatabaseService;

// src/core/support/user_data_service.js

const UserDataManager = require('../../data/manager/user_data_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const { ValidationError } = require('../../cross/entity/errors');

/**
 * User Data Service - Business logic for user data operations
 */
class UserDataService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new UserDataManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Store pointer data
     */
    async storePointer(name, content, userEmail, token) {
        try {
            if (!content || typeof content !== 'string') {
                throw new ValidationError('Content must be a non-empty string');
            }

            const result = await this.manager.storePointer(userEmail, name, content, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(name, data, userEmail, token) {
        try {
            if (!data || typeof data !== 'object') {
                throw new ValidationError('Data must be an object');
            }

            const result = await this.manager.storeStructure(userEmail, name, data, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(name, values, userEmail, token) {
        try {
            if (!Array.isArray(values) || values.length === 0) {
                throw new ValidationError('Values must be a non-empty array');
            }

            const result = await this.manager.storeEnum(userEmail, name, values, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user data
     */
    async getUserData(dataType, name, userEmail, token) {
        try {
            const data = await this.manager.getUserData(userEmail, dataType, name, token);

            return {
                type: dataType,
                name,
                data
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * List user data
     */
    async listUserData(dataType = null, pattern = '*', userEmail, token) {
        try {
            const items = await this.manager.listUserData(userEmail, dataType, pattern, token);

            return {
                type: dataType,
                pattern,
                items,
                count: items.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user data
     */
    async deleteUserData(dataType, name, userEmail, token) {
        try {
            const result = await this.manager.deleteUserData(userEmail, dataType, name, token);

            return result;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserDataService;

// src/core/support/snl_service.js

const SNLManager = require('../../data/manager/snl_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const SNLRequest = require('../../cross/entity/snl_request');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * SNL Service - Business logic for SNL operations
 */
class SNLService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new SNLManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Execute SNL command
     */
    async executeSNL(command, userPermissions, userEmail, token) {
        try {
            // Validate SNL command
            const errors = this.manager.validateSNLCommand(command);
            if (errors.length > 0) {
                throw new ValidationError(`SNL validation failed: ${errors.join(', ')}`);
            }

            // Parse command to check permissions
            const operation = this.manager.parseSNLOperation(command);
            const path = this.manager.parseSNLPath(command);

            // Check permissions
            await this._validateSNLPermissions(operation, path, userPermissions, userEmail);

            // Create SNL request
            const snlRequest = new SNLRequest({
                command,
                aiName: this.aiName,
                userEmail,
                token
            });

            // Execute SNL
            const result = await this.manager.executeSNL(snlRequest, token);

            return {
                operation,
                path,
                result: result.toJSON()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate SNL permissions
     */
    async _validateSNLPermissions(operation, path, userPermissions, userEmail) {
        // If no database specified, allow (global operations)
        if (!path.database) {
            return;
        }

        // Check if user data access
        const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
        if (path.database === 'user-data' && path.namespace === userDataNamespace) {
            return; // User can access their own data
        }

        // Check permissions for other databases
        const permission = userPermissions.find(p => p.database === path.database);
        if (!permission) {
            throw new AuthorizationError(`No permissions for database: ${path.database}`);
        }

        const requiredLevel = this.manager.getRequiredPermissionLevel(operation);
        if (permission.level < requiredLevel) {
            throw new AuthorizationError(`Insufficient permissions for operation: ${operation}`);
        }
    }
}

module.exports = SNLService;

// src/api/support/routes.js

const express = require('express');
const CommandController = require('./command_controller');
const TimelineController = require('./timeline_controller');
const ConfigController = require('./config_controller');
const TagController = require('./tag_controller');
const DatabaseController = require('./database_controller');
const UserDataController = require('./user_data_controller');
const SNLController = require('./snl_controller');

/**
 * Support API Routes
 */
function createSupportRoutes(aiName) {
    const router = express.Router();

    // Initialize controllers
    const commandController = new CommandController(aiName);
    const timelineController = new TimelineController(aiName);
    const configController = new ConfigController(aiName);
    const tagController = new TagController(aiName);
    const databaseController = new DatabaseController();
    const userDataController = new UserDataController(aiName);
    const snlController = new SNLController(aiName);

    // Command routes
    router.post('/command', commandController.createCommand.bind(commandController));
    router.get('/command/:id', commandController.getCommand.bind(commandController));
    router.put('/command/:id', commandController.updateCommand.bind(commandController));
    router.delete('/command/:id', commandController.deleteCommand.bind(commandController));
    router.get('/commands', commandController.listCommands.bind(commandController));
    router.get('/commands/search', commandController.searchCommands.bind(commandController));

    // Timeline routes
    router.post('/timeline', timelineController.recordInteraction.bind(timelineController));
    router.get('/timeline', timelineController.getTimeline.bind(timelineController));
    router.get('/timeline/search', timelineController.searchTimeline.bind(timelineController));
    router.post('/timeline/tag', timelineController.addTagToEntry.bind(timelineController));
    router.get('/timeline/summary', timelineController.getTimelineSummary.bind(timelineController));
    router.get('/timeline/recent', timelineController.getRecentEntries.bind(timelineController));

    // Config routes
    router.get('/config', configController.getAIConfig.bind(configController));
    router.put('/config/theme', configController.updateTheme.bind(configController));
    router.put('/config/behavior', configController.updateBehavior.bind(configController));
    router.get('/config/behavior-override', configController.getBehaviorOverride.bind(configController));
    router.put('/config/behavior-override', configController.setBehaviorOverride.bind(configController));
    router.post('/config/reset', configController.resetToDefault.bind(configController));

    // Tag routes
    router.post('/tag', tagController.addTag.bind(tagController));
    router.delete('/tag', tagController.removeTag.bind(tagController));
    router.get('/tags', tagController.listTags.bind(tagController));
    router.post('/tags/match', tagController.matchTags.bind(tagController));
    router.get('/tag/:tag', tagController.viewTag.bind(tagController));

    // Database routes
    router.post('/db', databaseController.createDatabase.bind(databaseController));
    router.get('/db', databaseController.listDatabases.bind(databaseController));
    router.delete('/db/:name', databaseController.dropDatabase.bind(databaseController));
    router.post('/db/:db/namespace', databaseController.createNamespace.bind(databaseController));
    router.get('/db/:db/namespace', databaseController.listNamespaces.bind(databaseController));
    router.delete('/db/:db/namespace/:name', databaseController.dropNamespace.bind(databaseController));

    // User Data routes
    router.post('/data/pointer', userDataController.storePointer.bind(userDataController));
    router.post('/data/structure', userDataController.storeStructure.bind(userDataController));
    router.post('/data/enum', userDataController.storeEnum.bind(userDataController));
    router.get('/data/:type/:name', userDataController.getUserData.bind(userDataController));
    router.get('/data', userDataController.listUserData.bind(userDataController));
    router.delete('/data/:type/:name', userDataController.deleteUserData.bind(userDataController));

    // SNL routes
    router.post('/snl', snlController.executeSNL.bind(snlController));

    return router;
}

module.exports = createSupportRoutes;