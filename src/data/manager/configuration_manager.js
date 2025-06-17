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
                console.log('Configuration structure does not exist yet');
                // Note: We cannot create the structure itself in SNL, only set entities
            }
        } catch (error) {
            console.error('Failed to check configuration structure:', error);
            throw error;
        }
    }

    /**
     * Set configuration (create or update)
     * @param {Configuration} config - Configuration entity
     * @returns {Promise<Configuration>}
     */
    async setConfiguration(config) {
        try {
            const validation = config.validate();
            if (!validation.valid) {
                throw new ValidationError(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }

            config.updatedAt = new Date().toISOString();
            const configData = this.snl.buildConfigData(config);
            const command = this.snl.setConfigSNL(config.id, configData);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration set: ${config.id}`);
            return config;
        } catch (error) {
            console.error('Failed to set configuration:', error);
            throw error;
        }
    }

    /**
     * Get configuration by ID
     * @param {string} configId - Configuration ID
     * @returns {Promise<Configuration|null>}
     */
    async getConfiguration(configId) {
        try {
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
     * List configurations
     * @param {Object} options - List options
     * @returns {Promise<Configuration[]>}
     */
    async listConfigurations(options = {}) {
        try {
            const { pattern = '*', page = 1, limit = 20 } = options;

            const command = this.snl.listConfigsSNL(pattern);
            const response = await this.sender.executeSNL(command, this.aiToken);

            const configIds = this.snl.parseConfigsList(response);
            const configurations = [];

            for (const configId of configIds) {
                const config = await this.getConfiguration(configId);
                if (config) {
                    configurations.push(config);
                }
            }

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return configurations.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to list configurations:', error);
            throw error;
        }
    }

    /**
     * Search configurations
     * @param {string} searchTerm - Search term
     * @returns {Promise<Configuration[]>}
     */
    async searchConfigurations(searchTerm) {
        try {
            const command = this.snl.searchConfigsSNL(searchTerm);
            const response = await this.sender.executeSNL(command, this.aiToken);

            const configIds = this.snl.parseConfigsList(response);
            const configurations = [];

            for (const configId of configIds) {
                const config = await this.getConfiguration(configId);
                if (config) {
                    configurations.push(config);
                }
            }

            return configurations;
        } catch (error) {
            console.error('Failed to search configurations:', error);
            throw error;
        }
    }

    /**
     * Remove configuration
     * @param {string} configId - Configuration ID
     * @returns {Promise<boolean>}
     */
    async removeConfiguration(configId) {
        try {
            // Check if configuration exists first
            const existingConfig = await this.getConfiguration(configId);
            if (!existingConfig) {
                throw new NotFoundError(`Configuration not found: ${configId}`);
            }

            // Prevent removal of system configurations
            if (existingConfig.isSystem) {
                throw new ValidationError(`Cannot remove system configuration: ${configId}`);
            }

            const command = this.snl.removeConfigSNL(configId);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration removed: ${configId}`);
            return true;
        } catch (error) {
            console.error('Failed to remove configuration:', error);
            throw error;
        }
    }

    /**
     * Drop all configurations (delete entire entity)
     * @returns {Promise<boolean>}
     */
    async dropAllConfigurations() {
        try {
            const command = this.snl.dropConfigsEntitySNL();
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ All configurations dropped`);
            return true;
        } catch (error) {
            console.error('Failed to drop configurations:', error);
            throw error;
        }
    }

    /**
     * Check if configuration exists
     * @param {string} configId - Configuration ID
     * @returns {Promise<boolean>}
     */
    async configurationExists(configId) {
        try {
            const config = await this.getConfiguration(configId);
            return config !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Tag configuration
     * @param {string} configId - Configuration ID
     * @param {string} tagName - Tag name
     * @returns {Promise<boolean>}
     */
    async tagConfiguration(configId, tagName) {
        try {
            // Check if configuration exists
            const exists = await this.configurationExists(configId);
            if (!exists) {
                throw new NotFoundError(`Configuration not found: ${configId}`);
            }

            const command = this.snl.tagConfigSNL(configId, tagName);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration tagged: ${configId} with ${tagName}`);
            return true;
        } catch (error) {
            console.error('Failed to tag configuration:', error);
            throw error;
        }
    }

    /**
     * Untag configuration
     * @param {string} configId - Configuration ID
     * @param {string} tagName - Tag name
     * @returns {Promise<boolean>}
     */
    async untagConfiguration(configId, tagName) {
        try {
            // Check if configuration exists
            const exists = await this.configurationExists(configId);
            if (!exists) {
                throw new NotFoundError(`Configuration not found: ${configId}`);
            }

            const command = this.snl.untagConfigSNL(configId, tagName);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Configuration untagged: ${configId} removed ${tagName}`);
            return true;
        } catch (error) {
            console.error('Failed to untag configuration:', error);
            throw error;
        }
    }

    /**
     * Get configurations by tags
     * @param {string[]} tags - Tags to match
     * @returns {Promise<Configuration[]>}
     */
    async getConfigurationsByTags(tags) {
        try {
            const command = this.snl.matchConfigsByTagSNL(tags);
            const response = await this.sender.executeSNL(command, this.aiToken);

            const configIds = this.snl.parseConfigsList(response);
            const configurations = [];

            for (const configId of configIds) {
                const config = await this.getConfiguration(configId);
                if (config) {
                    configurations.push(config);
                }
            }

            return configurations;
        } catch (error) {
            console.error('Failed to get configurations by tags:', error);
            throw error;
        }
    }

    /**
     * Set default configuration
     * @param {Configuration} config - Configuration to set as default
     * @returns {Promise<Configuration>}
     */
    async setDefaultConfiguration(config) {
        try {
            // Remove default tag from all configurations
            const allConfigs = await this.listConfigurations();
            for (const cfg of allConfigs) {
                if (cfg.isDefault) {
                    await this.untagConfiguration(cfg.id, 'default');
                }
            }

            // Set this configuration as default
            config.isDefault = true;
            await this.setConfiguration(config);
            await this.tagConfiguration(config.id, 'default');

            return config;
        } catch (error) {
            console.error('Failed to set default configuration:', error);
            throw error;
        }
    }
}

module.exports = ConfigurationManager;