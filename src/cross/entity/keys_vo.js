// src/cross/entity/keys_vo.js

const ConfigSNL = require('../../data/snl/config_snl');
const NeuronDBSender = require('../../data/neuron_db/sender');

/**
 * KeysVO - Value Object for system keys (Singleton)
 * Stores all keys from config database and active AI
 * Auto-refreshes after 1 hour timeout
 */
class KeysVO {
    constructor() {
        // Singleton instance
        if (KeysVO.instance) {
            return KeysVO.instance;
        }

        this.keys = {
            config: {},      // Keys from config database
            ai: {}           // Keys from active AI
        };

        this.lastRefresh = null;
        this.timeout = 60 * 60 * 1000; // 1 hour in milliseconds
        this.configSNL = new ConfigSNL();
        this.configSender = new NeuronDBSender();
        this.aiSender = null; // Set when AI is selected

        KeysVO.instance = this;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!KeysVO.instance) {
            KeysVO.instance = new KeysVO();
        }
        return KeysVO.instance;
    }

    /**
     * Check if refresh is needed
     */
    needsRefresh() {
        if (!this.lastRefresh) return true;

        const now = Date.now();
        const elapsed = now - this.lastRefresh;

        return elapsed > this.timeout;
    }

    /**
     * Set active AI sender
     */
    setAISender(aiSender) {
        this.aiSender = aiSender;
        // Clear AI keys when changing AI
        this.keys.ai = {};
        this.lastRefresh = null;
    }

    /**
     * Refresh all keys
     */
    async refresh(token) {
        try {
            // Refresh config keys
            await this.refreshConfigKeys(token);

            // Refresh AI keys if AI is set
            if (this.aiSender) {
                await this.refreshAIKeys(token);
            }

            this.lastRefresh = Date.now();

        } catch (error) {
            console.error('Error refreshing keys:', error);
            throw error;
        }
    }

    /**
     * Refresh config database keys
     */
    async refreshConfigKeys(token) {
        try {
            // Get API keys
            const apiKeysSNL = 'view(structure)\non(config.keys.api)';
            const apiKeysResponse = await this.configSender.executeSNL(apiKeysSNL, token);
            this.keys.config.api = this.parseKeysResponse(apiKeysResponse);

            // Get system keys
            const systemKeysSNL = 'view(structure)\non(config.keys.system)';
            const systemKeysResponse = await this.configSender.executeSNL(systemKeysSNL, token);
            this.keys.config.system = this.parseKeysResponse(systemKeysResponse);

            // Get security keys
            const securityKeysSNL = 'view(structure)\non(config.keys.security)';
            const securityKeysResponse = await this.configSender.executeSNL(securityKeysSNL, token);
            this.keys.config.security = this.parseKeysResponse(securityKeysResponse);

        } catch (error) {
            console.error('Error refreshing config keys:', error);
            // Don't throw - partial refresh is better than none
        }
    }

    /**
     * Refresh AI database keys
     */
    async refreshAIKeys(token) {
        if (!this.aiSender) return;

        try {
            // Get AI-specific keys
            const aiKeysSNL = 'view(structure)\non(keys.ai_config)';
            const aiKeysResponse = await this.aiSender.executeSNL(aiKeysSNL, token);
            this.keys.ai.config = this.parseKeysResponse(aiKeysResponse);

            // Get AI model keys
            const modelKeysSNL = 'view(structure)\non(keys.models)';
            const modelKeysResponse = await this.aiSender.executeSNL(modelKeysSNL, token);
            this.keys.ai.models = this.parseKeysResponse(modelKeysResponse);

        } catch (error) {
            console.error('Error refreshing AI keys:', error);
            // Don't throw - partial refresh is better than none
        }
    }

    /**
     * Parse keys response from SNL
     */
    parseKeysResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        // If response has nested structure, flatten it
        const keys = {};
        Object.entries(response).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                // Nested object - extract actual key value
                keys[key] = value.value || value;
            } else {
                keys[key] = value;
            }
        });

        return keys;
    }

    /**
     * Get key value
     */
    async get(keyPath, token = null) {
        // Check if refresh needed
        if (this.needsRefresh() && token) {
            await this.refresh(token);
        }

        // Parse key path (e.g., "config.api.openai" or "ai.models.gpt4")
        const parts = keyPath.split('.');

        let value = this.keys;
        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Get all config keys
     */
    getConfigKeys() {
        return { ...this.keys.config };
    }

    /**
     * Get all AI keys
     */
    getAIKeys() {
        return { ...this.keys.ai };
    }

    /**
     * Get all keys
     */
    getAllKeys() {
        return {
            config: this.getConfigKeys(),
            ai: this.getAIKeys(),
            lastRefresh: this.lastRefresh,
            needsRefresh: this.needsRefresh()
        };
    }

    /**
     * Set key value (for testing/mocking)
     */
    setKey(keyPath, value) {
        const parts = keyPath.split('.');

        let target = this.keys;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!target[part] || typeof target[part] !== 'object') {
                target[part] = {};
            }
            target = target[part];
        }

        target[parts[parts.length - 1]] = value;
    }

    /**
     * Clear all keys
     */
    clear() {
        this.keys = {
            config: {},
            ai: {}
        };
        this.lastRefresh = null;
    }

    /**
     * Force refresh on next access
     */
    invalidate() {
        this.lastRefresh = null;
    }
}

// Export singleton instance
module.exports = KeysVO.getInstance();