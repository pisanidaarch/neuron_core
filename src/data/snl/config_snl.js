// src/data/snl/config_snl.js

/**
 * Config SNL - SNL operations for AI configuration
 */
class ConfigSNL {
    constructor() {
        // Config operations
    }

    /**
     * Get AI config SNL
     */
    getAIConfigSNL(aiName) {
        return `view(structure)\non(main.core.ai_config)`;
    }

    /**
     * Set AI config SNL
     */
    setAIConfigSNL(aiName, config) {
        return `set(structure)\nvalues("ai_config", ${JSON.stringify(config)})\non(main.core.ai_config)`;
    }

    /**
     * Update AI theme SNL
     */
    updateAIThemeSNL(aiName, theme) {
        return `set(structure)\nvalues("theme", ${JSON.stringify(theme)})\non(main.core.ai_config)`;
    }

    /**
     * Update AI behavior SNL
     */
    updateAIBehaviorSNL(aiName, behavior) {
        return `set(structure)\nvalues("behavior", ${JSON.stringify(behavior)})\non(main.core.ai_config)`;
    }

    /**
     * Get behavior override SNL
     */
    getBehaviorOverrideSNL(aiName) {
        return `view(structure)\non(config.${aiName}.behavior_override)`;
    }

    /**
     * Set behavior override SNL
     */
    setBehaviorOverrideSNL(aiName, behavior) {
        return `set(structure)\nvalues("behavior_override", ${JSON.stringify(behavior)})\non(config.${aiName}.behavior_override)`;
    }

    /**
     * Check if AI config exists
     */
    checkAIConfigSNL() {
        return `list(structure)\nvalues("ai_config")\non(main.core)`;
    }

    /**
     * Create AI config entity
     */
    createAIConfigSNL(aiName, config) {
        return `set(structure)\nvalues("ai_config", ${JSON.stringify(config)})\non(main.core.ai_config)`;
    }

    /**
     * Parse AI config response
     */
    parseAIConfig(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return response;
    }

    /**
     * Validate config structure
     */
    validateConfigStructure(config) {
        const required = ['aiName', 'theme', 'behavior'];
        const missing = required.filter(field => !config[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required config fields: ${missing.join(', ')}`);
        }

        return true;
    }
}

module.exports = ConfigSNL;