// src/data/manager/keys_vo_manager.js

const KeysVO = require('../../cross/entity/keys_vo');
const fs = require('fs').promises;
const path = require('path');

/**
 * KeysVOManager - Manages KeysVO initialization and updates
 */
class KeysVOManager {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config.json');
        this.keysVO = null;
    }

    /**
     * Initialize KeysVO from config file
     * @returns {Promise<KeysVO>}
     */
    async initialize() {
        try {
            console.log('Initializing KeysVO from config...');

            // Read config file
            const configData = await this.loadConfig();

            // Create or get KeysVO instance
            this.keysVO = await KeysVO.getInstance();

            // Update with config data
            await this.updateFromConfig(configData);

            console.log('✅ KeysVO initialized successfully');
            return this.keysVO;

        } catch (error) {
            console.error('❌ Failed to initialize KeysVO:', error);
            throw error;
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

        // Set AI instances
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
     * Reload configuration
     * @returns {Promise<void>}
     */
    async reload() {
        const configData = await this.loadConfig();
        await this.updateFromConfig(configData);
        console.log('✅ Configuration reloaded');
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

        if (!config.ai_instances || Object.keys(config.ai_instances).length === 0) {
            errors.push('At least one AI instance configuration is required');
        } else {
            for (const [aiName, aiConfig] of Object.entries(config.ai_instances)) {
                if (!aiConfig.name) {
                    errors.push(`AI instance ${aiName} is missing name`);
                }
                if (!aiConfig.url) {
                    errors.push(`AI instance ${aiName} is missing url`);
                }
                if (!aiConfig.token) {
                    errors.push(`AI instance ${aiName} is missing token`);
                }
            }
        }

        if (!config.security || !config.security.jwt_secret) {
            errors.push('JWT secret is required in security configuration');
        }

        return errors;
    }
}

module.exports = KeysVOManager;