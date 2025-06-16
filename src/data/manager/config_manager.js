// src/data/manager/config_manager.js

const ConfigSNL = require('../snl/config_snl');
const NeuronDBSender = require('../neuron_db/sender');
const AIConfig = require('../../cross/entity/ai_config');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Config Manager - Manages AI configuration
 */
class ConfigManager {
    constructor() {
        this.snl = new ConfigSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(aiName, token) {
        try {
            const getSNL = this.snl.getAIConfigSNL(aiName);
            const response = await this.sender.executeSNL(getSNL, token);

            if (!response) {
                // Return default config if none exists
                return new AIConfig({ aiName });
            }

            const configData = this.snl.parseAIConfig(response);
            return new AIConfig({ aiName, ...configData });

        } catch (error) {
            throw new NeuronDBError(`Failed to get AI config: ${error.message}`);
        }
    }

    /**
     * Update AI configuration
     */
    async updateAIConfig(aiConfig, token) {
        try {
            // Validate config
            const errors = aiConfig.validate();
            if (errors.length > 0) {
                throw new Error(`AI config validation failed: ${errors.join(', ')}`);
            }

            this.snl.validateConfigStructure(aiConfig.toJSON());

            // Ensure config entity exists
            await this._ensureConfigEntity(token);

            const updateSNL = this.snl.setAIConfigSNL(aiConfig.aiName, aiConfig.toJSON());
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiConfig.aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI config: ${error.message}`);
        }
    }

    /**
     * Update AI theme only
     */
    async updateAITheme(aiName, theme, token) {
        try {
            const updateSNL = this.snl.updateAIThemeSNL(aiName, theme);
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI theme: ${error.message}`);
        }
    }

    /**
     * Update AI behavior only
     */
    async updateAIBehavior(aiName, behavior, token) {
        try {
            const updateSNL = this.snl.updateAIBehaviorSNL(aiName, behavior);
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI behavior: ${error.message}`);
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(aiName, token) {
        try {
            const getSNL = this.snl.getBehaviorOverrideSNL(aiName);
            const response = await this.sender.executeSNL(getSNL, token);

            return response || null;

        } catch (error) {
            throw new NeuronDBError(`Failed to get behavior override: ${error.message}`);
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(aiName, behavior, token) {
        try {
            const setSNL = this.snl.setBehaviorOverrideSNL(aiName, behavior);
            const response = await this.sender.executeSNL(setSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to set behavior override: ${error.message}`);
        }
    }

    /**
     * Ensure config entity exists
     */
    async _ensureConfigEntity(token) {
        try {
            const checkSNL = this.snl.checkAIConfigSNL();
            const response = await this.sender.executeSNL(checkSNL, token);

            if (!response || (Array.isArray(response) && !response.includes('ai_config'))) {
                const defaultConfig = new AIConfig({ aiName: 'default' });
                const createSNL = this.snl.createAIConfigSNL('default', defaultConfig.toJSON());
                await this.sender.executeSNL(createSNL, token);
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure config entity:', error.message);
        }
    }
}

module.exports = ConfigManager;