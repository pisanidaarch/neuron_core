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