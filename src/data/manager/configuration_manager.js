// src/data/manager/configuration_manager.js

const Configuration = require('../../cross/entity/configuration');
const ConfigurationSNL = require('../snl/configuration_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * ConfigurationManager - Manages Configuration entity operations
 */
class ConfigurationManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new ConfigurationSNL();
        this.sender = new AISender();
    }

    /**
     * Initialize configuration structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.snl.checkConfigStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiToken);

            const exists = this.snl.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.snl.createConfigStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiToken);
                console.log('✅ Configuration structure created');
            }
        } catch (error) {
            console.error('Failed to initialize configuration structure:', error);
            throw error;
        }
    }

    /**
     * Save configuration
     * @param {Configuration} config - Configuration entity
     * @returns {Promise<Configuration>}
     */
    async saveConfiguration(config) {
        try {
            const validation = config.validate();
            if (!validation.valid) {
                throw new ValidationError(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }

            config.updatedAt = new Date().toISOString();
            const configData = this.snl.buildConfigData(config);
            const command = this.snl.setConfigSNL(config.id, configData);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration saved: ${config.id}`);
            return config;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            throw error;
        }
    }

    /**
     * Get configuration by AI name
     * @param {string} aiName - AI name
     * @returns {Promise<Configuration|null>}
     */
    async getConfiguration(aiName) {
        try {
            const configId = `config_${aiName}`;
            const command = this.snl.getConfigSNL(configId);
            const response = await this.sender.executeSNL(command, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const configData = this.snl.parseConfigData(response);
            return Configuration.fromObject(configData);
        } catch (error) {
            console.error('Failed to get configuration:', error);
            throw error;
        }
    }

    /**
     * Get or create default configuration
     * @param {string} aiName - AI name
     * @returns {Promise<Configuration>}
     */
    async getOrCreateConfiguration(aiName) {
        try {
            let config = await this.getConfiguration(aiName);

            if (!config) {
                config = Configuration.createDefault(aiName);
                await this.saveConfiguration(config);
            }

            return config;
        } catch (error) {
            console.error('Failed to get or create configuration:', error);
            throw error;
        }
    }

    /**
     * Update configuration colors
     * @param {string} aiName - AI name
     * @param {Object} colors - New colors
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateColors(aiName, colors, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateColors(colors);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update colors:', error);
            throw error;
        }
    }

    /**
     * Update configuration logo
     * @param {string} aiName - AI name
     * @param {Object} logo - New logo data
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateLogo(aiName, logo, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateLogo(logo);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update logo:', error);
            throw error;
        }
    }

    /**
     * Update configuration behavior
     * @param {string} aiName - AI name
     * @param {string} behavior - New behavior
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateBehavior(aiName, behavior, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateBehavior(behavior);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update behavior:', error);
            throw error;
        }
    }

    /**
     * Update UI settings
     * @param {string} aiName - AI name
     * @param {Object} uiSettings - New UI settings
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateUISettings(aiName, uiSettings, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateUI(uiSettings);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update UI settings:', error);
            throw error;
        }
    }

    /**
     * Update feature flags
     * @param {string} aiName - AI name
     * @param {Object} features - New feature flags
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateFeatures(aiName, features, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateFeatures(features);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update features:', error);
            throw error;
        }
    }

    /**
     * Update limits
     * @param {string} aiName - AI name
     * @param {Object} limits - New limits
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateLimits(aiName, limits, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateLimits(limits);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update limits:', error);
            throw error;
        }
    }

    /**
     * Update integrations
     * @param {string} aiName - AI name
     * @param {Object} integrations - New integration settings
     * @param {string} updatedBy - User who updated
     * @returns {Promise<Configuration>}
     */
    async updateIntegrations(aiName, integrations, updatedBy) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            config.updateIntegrations(integrations);
            config.updatedBy = updatedBy;

            return await this.saveConfiguration(config);
        } catch (error) {
            console.error('Failed to update integrations:', error);
            throw error;
        }
    }

    /**
     * Delete configuration
     * @param {string} aiName - AI name
     * @returns {Promise<boolean>}
     */
    async deleteConfiguration(aiName) {
        try {
            const configId = `config_${aiName}`;
            const command = this.snl.removeConfigSNL(configId);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration deleted: ${configId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete configuration:', error);
            throw error;
        }
    }

    /**
     * List all configurations
     * @returns {Promise<Configuration[]>}
     */
    async listConfigurations() {
        try {
            const command = this.snl.listConfigsSNL();
            const response = await this.sender.executeSNL(command, this.aiToken);

            const configIds = this.snl.parseConfigsList(response);
            const configurations = [];

            for (const configId of configIds) {
                const config = await this.getConfiguration(configId.replace('config_', ''));
                if (config) {
                    configurations.push(config);
                }
            }

            return configurations;
        } catch (error) {
            console.error('Failed to list configurations:', error);
            throw error;
        }
    }

    /**
     * Reset configuration to default
     * @param {string} aiName - AI name
     * @returns {Promise<Configuration>}
     */
    async resetToDefault(aiName) {
        try {
            const defaultConfig = Configuration.createDefault(aiName);
            return await this.saveConfiguration(defaultConfig);
        } catch (error) {
            console.error('Failed to reset configuration to default:', error);
            throw error;
        }
    }

    /**
     * Get CSS variables for colors
     * @param {string} aiName - AI name
     * @returns {Promise<Object>}
     */
    async getCSSVariables(aiName) {
        try {
            const config = await this.getOrCreateConfiguration(aiName);
            return config.getCSSVariables();
        } catch (error) {
            console.error('Failed to get CSS variables:', error);
            throw error;
        }
    }

    /**
     * Check if configuration exists
     * @param {string} aiName - AI name
     * @returns {Promise<boolean>}
     */
    async configurationExists(aiName) {
        try {
            const config = await this.getConfiguration(aiName);
            return config !== null;
        } catch (error) {
            return false;
        }
    }
}

module.exports = ConfigurationManager;