// src/data/snl/keys_vo_snl.js

/**
 * KeysVOSNL - SNL commands for KeysVO entity
 * Handles configuration data retrieval from NeuronDB
 */
class KeysVOSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * Get agents configuration SNL
     * @returns {string}
     */
    getAgentsConfigSNL() {
        return 'view(structure)\non(config.general.agent)';
    }

    /**
     * Get AIs configuration SNL
     * @returns {string}
     */
    getAIsConfigSNL() {
        return 'view(structure)\non(config.general.ai)';
    }

    /**
     * Get behavior configuration SNL for specific AI
     * @param {string} aiName - Name of the AI
     * @returns {string}
     */
    getAIBehaviorSNL(aiName) {
        if (!aiName) {
            throw new Error('AI name is required for behavior SNL');
        }
        return `view(structure)\non(config.${aiName}.behavior)`;
    }

    /**
     * Parse agents config response
     * @param {Object} response - Raw response from NeuronDB
     * @returns {Object} Parsed agents configuration
     */
    parseAgentsConfig(response) {
        // Response should already be a JSON object with agent configurations
        if (!response || typeof response !== 'object') {
            return {};
        }

        // Validate and normalize agent data
        const agents = {};
        for (const [agentName, agentConfig] of Object.entries(response)) {
            if (agentConfig && typeof agentConfig === 'object') {
                agents[agentName] = {
                    ...agentConfig,
                    // Ensure required fields exist
                    apiKey: agentConfig.apiKey || '',
                    url: agentConfig.url || '',
                    model: agentConfig.model || agentConfig.models || '',
                    models: agentConfig.models || [{ model: agentConfig.model }]
                };
            }
        }

        return agents;
    }

    /**
     * Parse AIs config response
     * @param {Object} response - Raw response from NeuronDB
     * @returns {Object} Parsed AIs configuration
     */
    parseAIsConfig(response) {
        // Response should be object with AI names as keys
        if (!response || typeof response !== 'object') {
            return {};
        }

        const ais = {};
        for (const [aiName, aiConfig] of Object.entries(response)) {
            if (aiConfig && typeof aiConfig === 'object') {
                // Each AI has its token under its own name
                ais[aiName] = {
                    ...aiConfig,
                    token: aiConfig[aiName] || ''
                };
            }
        }

        return ais;
    }

    /**
     * Parse AI behavior response
     * @param {Object} response - Raw response from NeuronDB
     * @returns {Object} Parsed behavior configuration
     */
    parseAIBehavior(response) {
        // Response should contain behavior configurations
        if (!response || typeof response !== 'object') {
            return { default: { behavior: '' } };
        }

        // Ensure default behavior exists
        if (!response.default) {
            response.default = { behavior: '' };
        }

        return response;
    }

    /**
     * Build complete AI configuration with behavior
     * @param {Object} aiConfig - Basic AI configuration
     * @param {Object} behaviorConfig - Behavior configuration
     * @returns {Object} Complete AI configuration
     */
    buildCompleteAIConfig(aiConfig, behaviorConfig) {
        return {
            ...aiConfig,
            behavior: behaviorConfig
        };
    }
}

module.exports = KeysVOSNL;