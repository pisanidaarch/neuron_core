// src/data/snl/configuration_snl.js

/**
 * ConfigurationSNL - SNL commands for Configuration entity operations
 */
class ConfigurationSNL {
    constructor() {
        this.namespace = 'config-app.settings';
        this.entityName = 'configurations';
    }

    /**
     * Check if configurations structure exists
     * @returns {string}
     */
    checkConfigStructureExistsSNL() {
        return `list(structure)\nvalues("${this.entityName}")\non(${this.namespace})`;
    }

    /**
     * Create configurations structure if not exists
     * @returns {string}
     */
    createConfigStructureSNL() {
        return `set(structure)\nvalues("${this.entityName}", {})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Set configuration SNL
     * @param {string} configId - Configuration ID
     * @param {Object} configData - Configuration data
     * @returns {string}
     */
    setConfigSNL(configId, configData) {
        return `set(structure)\nvalues("${configId}", ${JSON.stringify(configData)})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get configuration SNL
     * @param {string} configId - Configuration ID
     * @returns {string}
     */
    getConfigSNL(configId) {
        return `view(structure)\nvalues("${configId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * List configurations SNL
     * @returns {string}
     */
    listConfigsSNL() {
        return `list(structure)\nvalues("*")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Remove configuration SNL
     * @param {string} configId - Configuration ID
     * @returns {string}
     */
    removeConfigSNL(configId) {
        return `remove(structure)\nvalues("${configId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Search configurations SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchConfigsSNL(searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Build configuration data for storage
     * @param {Configuration} config - Configuration entity
     * @returns {Object}
     */
    buildConfigData(config) {
        return {
            id: config.id,
            aiName: config.aiName,
            colors: config.colors,
            logo: config.logo,
            behavior: config.behavior,
            ui: config.ui,
            features: config.features,
            limits: config.limits,
            integrations: config.integrations,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            updatedBy: config.updatedBy
        };
    }

    /**
     * Parse structure exists response
     * @param {Object} response - SNL response
     * @returns {boolean}
     */
    parseStructureExistsResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }

        // If configurations entity exists, response should contain it
        return Object.prototype.hasOwnProperty.call(response, this.entityName);
    }

    /**
     * Parse configurations list response
     * @param {Object} response - SNL response
     * @returns {Array<string>}
     */
    parseConfigsList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        // Extract config IDs from response, excluding the entity name itself
        return Object.keys(response).filter(key => key !== this.entityName);
    }

    /**
     * Parse configuration data response
     * @param {Object} response - SNL response
     * @returns {Object}
     */
    parseConfigData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Return the first non-entity object found
        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                return value;
            }
        }

        return null;
    }

    /**
     * Validate configuration ID
     * @param {string} configId - Configuration ID to validate
     * @throws {Error} If configuration ID is invalid
     */
    validateConfigId(configId) {
        if (!configId || typeof configId !== 'string') {
            throw new Error('Configuration ID must be a non-empty string');
        }

        if (configId.length > 100) {
            throw new Error('Configuration ID must be 100 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validIdPattern.test(configId)) {
            throw new Error('Configuration ID can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Get behavior override SNL for specific AI
     * @param {string} aiName - AI name
     * @returns {string}
     */
    getBehaviorOverrideSNL(aiName) {
        return `view(structure)\nvalues("config_${aiName}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Set behavior override SNL for specific AI
     * @param {string} aiName - AI name
     * @param {string} behavior - Behavior text
     * @returns {string}
     */
    setBehaviorOverrideSNL(aiName, behavior) {
        const behaviorData = {
            aiName: aiName,
            behavior: behavior,
            updatedAt: new Date().toISOString()
        };
        return `set(structure)\nvalues("behavior_${aiName}", ${JSON.stringify(behaviorData)})\non(${this.namespace}.behaviors)`;
    }

    /**
     * Get colors override SNL for specific AI
     * @param {string} aiName - AI name
     * @returns {string}
     */
    getColorsOverrideSNL(aiName) {
        return `view(structure)\nvalues("colors_${aiName}")\non(${this.namespace}.colors)`;
    }

    /**
     * Set colors override SNL for specific AI
     * @param {string} aiName - AI name
     * @param {Object} colors - Colors object
     * @returns {string}
     */
    setColorsOverrideSNL(aiName, colors) {
        const colorsData = {
            aiName: aiName,
            colors: colors,
            updatedAt: new Date().toISOString()
        };
        return `set(structure)\nvalues("colors_${aiName}", ${JSON.stringify(colorsData)})\non(${this.namespace}.colors)`;
    }
}

module.exports = ConfigurationSNL;