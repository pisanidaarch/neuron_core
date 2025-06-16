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