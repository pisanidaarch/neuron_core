// src/data/snl/configuration_snl.js

const BaseSNL = require('./base_snl');

/**
 * Configuration SNL - Generates SNL commands for configuration operations
 */
class ConfigurationSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'main';
        this.namespace = 'config';
        this.entity = 'configurations';
    }

    /**
     * Check if configuration structure exists
     */
    checkConfigStructureExistsSNL() {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', this.entity, path);
    }

    /**
     * Set configuration (create or update)
     */
    setConfigSNL(configId, configData) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        const values = [configId, configData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * Get configuration by ID
     */
    getConfigSNL(configId) {
        const path = this.buildPath(this.database, this.namespace, this.entity, configId);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * List configurations
     */
    listConfigsSNL(pattern = '*') {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search configurations
     */
    searchConfigsSNL(searchTerm) {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove configuration
     */
    removeConfigSNL(configId) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('remove', 'structure', configId, path);
    }

    /**
     * Drop all configurations entity
     */
    dropConfigsEntitySNL() {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('drop', 'structure', null, path);
    }

    /**
     * Tag configuration
     */
    tagConfigSNL(configId, tagName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, configId);
        return this.buildSNL('tag', 'structure', tagName, path);
    }

    /**
     * Untag configuration
     */
    untagConfigSNL(configId, tagName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, configId);
        return this.buildSNL('untag', 'structure', tagName, path);
    }

    /**
     * Match configurations by tags
     */
    matchConfigsByTagSNL(tags) {
        const path = this.buildPath(this.database, this.namespace);
        const tagList = Array.isArray(tags) ? tags.join(',') : tags;
        return this.buildSNL('match', 'tag', tagList, path);
    }

    /**
     * Parse structure exists response
     */
    parseStructureExistsResponse(response) {
        if (!response || !Array.isArray(response)) {
            return false;
        }
        return response.includes(this.entity);
    }

    /**
     * Parse configuration data from response
     */
    parseConfigData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Handle structure response format
        const keys = Object.keys(response);
        if (keys.length === 0) {
            return null;
        }

        // Get first entry (should be the config ID)
        const configId = keys[0];
        const configData = response[configId];

        return {
            id: configId,
            ...configData
        };
    }

    /**
     * Parse configurations list from response
     */
    parseConfigsList(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }
        return response;
    }

    /**
     * Build configuration data structure
     */
    buildConfigData(configuration) {
        return {
            name: configuration.name,
            description: configuration.description,
            theme: configuration.theme,
            language: configuration.language,
            timezone: configuration.timezone,
            features: configuration.features || {},
            metadata: configuration.metadata || {},
            isActive: configuration.isActive !== undefined ? configuration.isActive : true,
            isDefault: configuration.isDefault || false,
            isSystem: configuration.isSystem || false,
            createdAt: configuration.createdAt || new Date().toISOString(),
            updatedAt: configuration.updatedAt || new Date().toISOString(),
            createdBy: configuration.createdBy,
            updatedBy: configuration.updatedBy
        };
    }

    /**
     * Validate configuration ID format
     */
    validateConfigId(configId) {
        if (!configId || typeof configId !== 'string' || configId.trim().length === 0) {
            throw new Error('Configuration ID is required');
        }

        // Config IDs should follow a specific format
        if (!/^[a-zA-Z0-9_-]+$/.test(configId)) {
            throw new Error('Configuration ID can only contain letters, numbers, dashes, and underscores');
        }

        return true;
    }
}

module.exports = ConfigurationSNL;