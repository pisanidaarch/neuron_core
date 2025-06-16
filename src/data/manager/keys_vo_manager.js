// src/data/manager/keys_vo_manager.js

const KeysVO = require('../../cross/entity/keys_vo');
const KeysVOSNL = require('../snl/keys_vo_snl');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * KeysVOManager - Manages KeysVO data loading and refresh
 */
class KeysVOManager {
    constructor() {
        this.keysVO = KeysVO.getInstance();
        this.snl = new KeysVOSNL();
        this.sender = null; // Will be initialized with proper URL
        this._refreshing = false;
        this._configToken = null;
    }

    /**
     * Initialize the manager and load initial data
     * @param {string} configToken - Config token (optional, will use from KeysVO if not provided)
     * @returns {Promise<void>}
     */
    async initialize(configToken = null) {
        // Use provided token or get from KeysVO
        this._configToken = configToken || this.keysVO.CONFIG_TOKEN;

        if (!this._configToken) {
            throw new Error('Config token is required for initialization');
        }

        this.sender = new NeuronDBSender(this.keysVO.NEURON_DB_URL);

        // Load initial data
        await this.refresh();
    }

    /**
     * Get current KeysVO instance, refreshing if needed
     * @returns {Promise<KeysVO>}
     */
    async getKeysVO() {
        if (this.keysVO.needsRefresh() && !this._refreshing) {
            try {
                await this.refresh();
            } catch (error) {
                // If refresh fails, return existing data
                console.error('Failed to refresh KeysVO:', error);
            }
        }
        return this.keysVO;
    }

    /**
     * Force refresh of all data
     * @returns {Promise<void>}
     */
    async refresh() {
        if (this._refreshing) {
            // Avoid multiple simultaneous refreshes
            return;
        }

        this._refreshing = true;

        try {
            // Load all configurations in parallel
            const [agents, ais] = await Promise.all([
                this._loadAgentsConfig(),
                this._loadAIsConfig()
            ]);

            // Load behaviors for each AI
            const aisWithBehaviors = await this._loadAIBehaviors(ais);

            // Update KeysVO
            this.keysVO.setAgents(agents);
            this.keysVO.setAIs(aisWithBehaviors);
            this.keysVO.updateRefreshTime();

        } finally {
            this._refreshing = false;
        }
    }

    /**
     * Load agents configuration
     * @returns {Promise<Object>}
     */
    async _loadAgentsConfig() {
        try {
            const snlCommand = this.snl.getAgentsConfigSNL();
            const response = await this.sender.executeSNL(snlCommand, this._configToken);
            return this.snl.parseAgentsConfig(response);
        } catch (error) {
            console.error('Failed to load agents config:', error);
            // Return existing data if available
            return this.keysVO.agents || {};
        }
    }

    /**
     * Load AIs configuration
     * @returns {Promise<Object>}
     */
    async _loadAIsConfig() {
        try {
            const snlCommand = this.snl.getAIsConfigSNL();
            const response = await this.sender.executeSNL(snlCommand, this._configToken);
            return this.snl.parseAIsConfig(response);
        } catch (error) {
            console.error('Failed to load AIs config:', error);
            // Return existing data if available
            return this.keysVO.ais || {};
        }
    }

    /**
     * Load behaviors for all AIs
     * @param {Object} ais - AIs configuration
     * @returns {Promise<Object>}
     */
    async _loadAIBehaviors(ais) {
        const aisWithBehaviors = {};

        // Load behaviors in parallel with concurrency limit
        const aiNames = Object.keys(ais);
        const concurrencyLimit = 5;

        for (let i = 0; i < aiNames.length; i += concurrencyLimit) {
            const batch = aiNames.slice(i, i + concurrencyLimit);
            const batchResults = await Promise.all(
                batch.map(async (aiName) => {
                    try {
                        const behavior = await this._loadAIBehavior(aiName);
                        return { aiName, behavior };
                    } catch (error) {
                        console.error(`Failed to load behavior for ${aiName}:`, error);
                        return { aiName, behavior: { default: { behavior: '' } } };
                    }
                })
            );

            // Merge results
            for (const { aiName, behavior } of batchResults) {
                aisWithBehaviors[aiName] = this.snl.buildCompleteAIConfig(
                    ais[aiName],
                    behavior
                );
            }
        }

        return aisWithBehaviors;
    }

    /**
     * Load behavior for specific AI
     * @param {string} aiName
     * @returns {Promise<Object>}
     */
    async _loadAIBehavior(aiName) {
        const snlCommand = this.snl.getAIBehaviorSNL(aiName);
        const response = await this.sender.executeSNL(snlCommand, this._configToken);
        return this.snl.parseAIBehavior(response);
    }

    /**
     * Get specific AI configuration
     * @param {string} aiName
     * @returns {Promise<Object|null>}
     */
    async getAIConfig(aiName) {
        const keysVO = await this.getKeysVO();
        return keysVO.getAI(aiName);
    }

    /**
     * Get specific agent configuration
     * @param {string} agentName
     * @returns {Promise<Object|null>}
     */
    async getAgentConfig(agentName) {
        const keysVO = await this.getKeysVO();
        return keysVO.getAgent(agentName);
    }

    /**
     * Update config token (if needed for re-authentication)
     * @param {string} newToken
     */
    updateConfigToken(newToken) {
        this._configToken = newToken;
    }
}

// Export singleton instance
let managerInstance = null;

module.exports = {
    /**
     * Get KeysVOManager instance
     * @returns {KeysVOManager}
     */
    getInstance() {
        if (!managerInstance) {
            managerInstance = new KeysVOManager();
        }
        return managerInstance;
    },

    /**
     * Initialize the manager (must be called before use)
     * @param {string} configToken
     * @returns {Promise<void>}
     */
    async initialize(configToken) {
        const instance = module.exports.getInstance(); // FIX: usar module.exports
        await instance.initialize(configToken);
    }
};