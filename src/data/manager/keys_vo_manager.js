// src/data/manager/keys_vo_manager.js

const KeysVO = require('../../cross/entity/keys_vo');
const NeuronDBSender = require('../neuron_db/sender');
const fs = require('fs').promises;
const path = require('path');

/**
 * KeysVOManager - Manages KeysVO initialization and updates
 * Now fetches AI tokens dynamically from config database
 */
class KeysVOManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config.json');
        this.keysVO = null;
        this.configSender = new NeuronDBSender();
    }

    /**
     * Initialize KeysVO from config file and fetch AI tokens from database
     * @returns {Promise<KeysVO>}
     */
    async initialize() {
        try {
            console.log('Initializing KeysVO from config...');

            // Read config file for basic configuration
            const configData = await this.loadConfig();

            // Validate config first
            const validationErrors = this.validateConfig(configData);
            if (validationErrors.length > 0) {
                throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
            }

            // Create or get KeysVO instance
            this.keysVO = await KeysVO.getInstance();

            // Update with config data (config URL and token)
            await this.updateFromConfig(configData);

            // Initialize config sender
            this.configSender.initialize(
                configData.database.config_url,
                configData.database.config_token
            );

            // Fetch AI tokens from database
            await this.loadAITokensFromDatabase();

            console.log('✅ KeysVO initialized successfully');
            return this.keysVO;

        } catch (error) {
            console.error('❌ Failed to initialize KeysVO:', error);
            throw error;
        }
    }

    /**
     * Load AI tokens from config database
     * @returns {Promise<void>}
     */
    async loadAITokensFromDatabase() {
        try {
            console.log('   📡 Fetching AI tokens from config database...');

            // Execute SNL to get AI configurations
            const snl = 'view(structure)\non(config.general.ai)';
            const response = await this.configSender.executeSNL(snl);

            if (!response || typeof response !== 'object') {
                console.warn('   ⚠️  No AI configurations found in database');
                return;
            }

            // Process each AI configuration
            let aiCount = 0;
            for (const [aiName, aiData] of Object.entries(response)) {
                if (aiData && aiData.key) {
                    // Decode the JWT to get the instance URL
                    const tokenParts = aiData.key.split('.');
                    if (tokenParts.length === 3) {
                        try {
                            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

                            // Set AI credentials with proper URL
                            // The URL should come from config or be constructed based on instance
                            const aiUrl = this.keysVO.getConfigUrl(); // Default to config URL

                            this.keysVO.setAICredentials(
                                aiName,
                                aiUrl,
                                aiData.key
                            );

                            console.log(`   ✅ Loaded token for AI: ${aiName} (level: ${payload.level}, instance: ${payload.instance})`);
                            aiCount++;
                        } catch (e) {
                            console.warn(`   ⚠️  Failed to decode token for AI ${aiName}:`, e.message);
                        }
                    }
                } else {
                    console.warn(`   ⚠️  No key found for AI: ${aiName}`);
                }
            }

            console.log(`   ✅ Loaded ${aiCount} AI tokens from database`);

        } catch (error) {
            console.error('   ❌ Failed to load AI tokens from database:', error);
            // Don't throw - use fallback tokens from config if database fetch fails
            console.warn('   ⚠️  Using fallback AI tokens from config.json');
        }
    }

    /**
     * Load configuration from file
     * @returns {Promise<Object>}
     */
    async loadConfig() {
        try {
            const configContent = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Config file not found at ${this.configPath}. Please copy config.json.example to config.json and configure it.`);
            }
            throw new Error(`Failed to read config file: ${error.message}`);
        }
    }

    /**
     * Update KeysVO with configuration data
     * @param {Object} config - Configuration object
     * @returns {Promise<void>}
     */
    async updateFromConfig(config) {
        if (!this.keysVO) {
            throw new Error('KeysVO not initialized');
        }

        // Set config database credentials
        if (config.database) {
            this.keysVO.setConfigCredentials(
                config.database.config_url,
                config.database.config_token
            );
        }

        // Set AI instances from config as fallback
        // These will be overridden by database values if available
        if (config.ai_instances) {
            for (const [aiName, aiConfig] of Object.entries(config.ai_instances)) {
                this.keysVO.setAICredentials(
                    aiName,
                    aiConfig.url,
                    aiConfig.token
                );
            }
        }

        // Set security settings
        if (config.security) {
            this.keysVO.setJWTSecret(config.security.jwt_secret);
            if (config.security.token_expiry) {
                this.keysVO.setTokenExpiry(config.security.token_expiry);
            }
        }
    }

    /**
     * Get KeysVO instance
     * @returns {KeysVO}
     */
    getKeysVO() {
        return this.keysVO;
    }

    /**
     * Reload configuration and refresh AI tokens
     * @returns {Promise<void>}
     */
    async reload() {
        const configData = await this.loadConfig();
        await this.updateFromConfig(configData);
        await this.loadAITokensFromDatabase();
        console.log('✅ Configuration reloaded');
    }

    /**
     * Refresh only AI tokens from database
     * @returns {Promise<void>}
     */
    async refreshAITokens() {
        await this.loadAITokensFromDatabase();
        await this.keysVO.refresh();
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration to validate
     * @returns {Array} Array of validation errors
     */
    validateConfig(config) {
        const errors = [];

        if (!config.database) {
            errors.push('Database configuration is required');
        } else {
            if (!config.database.config_url) {
                errors.push('Database config_url is required');
            }
            if (!config.database.config_token) {
                errors.push('Database config_token is required');
            }
        }

        // AI instances are now optional in config (will be loaded from database)
        // But we can still validate if they exist
        if (config.ai_instances) {
            for (const [aiName, aiConfig] of Object.entries(config.ai_instances)) {
                if (!aiConfig.name) {
                    errors.push(`AI instance ${aiName} is missing name`);
                }
                if (!aiConfig.url) {
                    errors.push(`AI instance ${aiName} is missing url`);
                }
                // Token is optional as it will be fetched from database
            }
        }

        if (!config.security || !config.security.jwt_secret) {
            errors.push('JWT secret is required in security configuration');
        }

        return errors;
    }
}

// Singleton instance for global access
let instance = null;

/**
 * Get singleton instance of KeysVOManager
 * @returns {KeysVOManager}
 */
function getInstance() {
    if (!instance) {
        instance = new KeysVOManager();
    }
    return instance;
}

/**
 * Initialize KeysVO Manager (convenience function)
 * @returns {Promise<KeysVO>}
 */
async function initialize() {
    const manager = getInstance();
    return await manager.initialize();
}

// Export functions and class
module.exports = {
    KeysVOManager,
    getInstance,
    initialize
};