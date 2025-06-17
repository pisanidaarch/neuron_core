// src/data/snl/config_snl.js

const BaseSNL = require('./base_snl');

/**
 * Config SNL - Generates SNL commands for configuration operations
 */
class ConfigSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'config';
        this.namespace = 'ai';
        this.entity = 'config';
    }

    /**
     * Get AI configuration
     */
    getAIConfigSNL(aiName) {
        const path = this.buildPath(this.database, this.namespace, this.entity, aiName);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set AI configuration
     */
    setAIConfigSNL(aiName, configData) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        const values = [aiName, configData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * List all AI configurations
     */
    listAIConfigsSNL(pattern = '*') {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Remove AI configuration
     */
    removeAIConfigSNL(aiName) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('remove', 'structure', aiName, path);
    }

    /**
     * Get theme configuration
     */
    getThemeConfigSNL(aiName, themeName) {
        const path = this.buildPath(this.database, this.namespace, 'themes', `${aiName}_${themeName}`);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set theme configuration
     */
    setThemeConfigSNL(aiName, themeName, themeData) {
        const path = this.buildPath(this.database, this.namespace, 'themes');
        const values = [`${aiName}_${themeName}`, themeData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * Get behavior configuration
     */
    getBehaviorConfigSNL(aiName) {
        const path = this.buildPath(this.database, this.namespace, 'behavior', aiName);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set behavior configuration
     */
    setBehaviorConfigSNL(aiName, behaviorData) {
        const path = this.buildPath(this.database, this.namespace, 'behavior');
        const values = [aiName, behaviorData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * Parse AI config from response
     */
    parseAIConfig(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const names = Object.keys(response);
        if (names.length === 0) {
            return null;
        }

        const aiName = names[0];
        const configData = response[aiName];

        return {
            aiName,
            ...configData
        };
    }

    /**
     * Parse config list from response
     */
    parseConfigList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([aiName, configData]) => ({
            aiName,
            ...configData
        }));
    }

    /**
     * Validate AI config structure
     */
    validateConfigStructure(configData) {
        if (!configData || typeof configData !== 'object') {
            throw new Error('Config data must be an object');
        }

        // Validate specific config sections if present
        if (configData.models) {
            if (!Array.isArray(configData.models)) {
                throw new Error('Config models must be an array');
            }
            configData.models.forEach(model => {
                if (!model.name || !model.provider) {
                    throw new Error('Each model must have name and provider');
                }
            });
        }

        if (configData.limits) {
            if (typeof configData.limits !== 'object') {
                throw new Error('Config limits must be an object');
            }
        }

        return true;
    }

    /**
     * Default AI configuration
     */
    getDefaultAIConfig(aiName) {
        return {
            aiName,
            models: [
                { name: 'gpt-4', provider: 'openai', enabled: true },
                { name: 'claude-3', provider: 'anthropic', enabled: true },
                { name: 'gemini-pro', provider: 'google', enabled: true }
            ],
            limits: {
                maxTokensPerRequest: 4000,
                maxRequestsPerHour: 100,
                maxRequestsPerDay: 1000
            },
            features: {
                streaming: true,
                contextMemory: true,
                multiModal: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

module.exports = ConfigSNL;