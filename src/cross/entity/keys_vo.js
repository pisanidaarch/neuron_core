// src/cross/entity/keys_vo.js

const config = require('./config');

/**
 * KeysVO - Value Object for system configuration keys
 * Singleton pattern with 5-minute refresh
 */
class KeysVO {
    constructor() {
        // Load from config.json
        this.NEURON_DB_URL = config.get('neuronDB.url');
        this.CONFIG_TOKEN = config.get('neuronDB.configToken');

        // Dynamic properties
        this.ais = {}; // { aiName: { aiName: token, behavior: {} } }
        this.agents = {}; // { agentName: { apiKey, url, models, etc } }

        // Control properties
        this._lastRefresh = null;
        this._refreshInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        this._instance = null;
    }

    /**
     * Get singleton instance
     * @returns {KeysVO}
     */
    static getInstance() {
        if (!KeysVO._instance) {
            KeysVO._instance = new KeysVO();
        }
        return KeysVO._instance;
    }

    /**
     * Check if data needs refresh
     * @returns {boolean}
     */
    needsRefresh() {
        if (!this._lastRefresh) return true;
        const now = Date.now();
        return (now - this._lastRefresh) > this._refreshInterval;
    }

    /**
     * Get AI configuration by name
     * @param {string} aiName
     * @returns {Object|null}
     */
    getAI(aiName) {
        return this.ais[aiName] || null;
    }

    /**
     * Get agent configuration by name
     * @param {string} agentName
     * @returns {Object|null}
     */
    getAgent(agentName) {
        return this.agents[agentName] || null;
    }

    /**
     * Get all AI names
     * @returns {string[]}
     */
    getAINames() {
        return Object.keys(this.ais);
    }

    /**
     * Get all agent names
     * @returns {string[]}
     */
    getAgentNames() {
        return Object.keys(this.agents);
    }

    /**
     * Set AIs data
     * @param {Object} aisData
     */
    setAIs(aisData) {
        this.ais = aisData || {};
    }

    /**
     * Set agents data
     * @param {Object} agentsData
     */
    setAgents(agentsData) {
        this.agents = agentsData || {};
    }

    /**
     * Update refresh timestamp
     */
    updateRefreshTime() {
        this._lastRefresh = Date.now();
    }

    /**
     * Get behavior for specific AI
     * @param {string} aiName
     * @returns {Object|null}
     */
    getAIBehavior(aiName) {
        const ai = this.getAI(aiName);
        return ai ? ai.behavior : null;
    }

    /**
     * Get system token for specific AI
     * @param {string} aiName
     * @returns {string|null}
     */
    getAIToken(aiName) {
        const ai = this.getAI(aiName);
        return ai ? ai[aiName] : null;
    }
}

// Export singleton instance getter
module.exports = KeysVO;