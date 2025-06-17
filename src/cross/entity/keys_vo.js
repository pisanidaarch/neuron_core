// src/cross/entity/keys_vo.js

/**
 * KeysVO - Value Object for storing all system keys and tokens
 * Implements singleton pattern with 1-hour timeout for reloading
 */
class KeysVO {
    constructor() {
        // Config database credentials
        this.configUrl = null;
        this.configToken = null;

        // AI instances credentials
        this.aiInstances = new Map();

        // Security settings
        this.jwtSecret = null;
        this.tokenExpiry = '24h';

        // Singleton and timeout management
        this.lastRefresh = new Date();
        this.refreshCallback = null;
        this.refreshTimeout = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    /**
     * Get singleton instance
     * @returns {Promise<KeysVO>}
     */
    static async getInstance() {
        if (!KeysVO.instance) {
            KeysVO.instance = new KeysVO();
        }

        // Check if refresh is needed (after 1 hour)
        const now = new Date();
        const timeDiff = now - KeysVO.instance.lastRefresh;

        if (timeDiff > KeysVO.instance.refreshTimeout) {
            console.log('🔄 KeysVO timeout reached, refreshing...');
            await KeysVO.instance.refresh();
        }

        return KeysVO.instance;
    }

    /**
     * Set config database credentials
     * @param {string} url - Config database URL
     * @param {string} token - Config database token
     */
    setConfigCredentials(url, token) {
        this.configUrl = url;
        this.configToken = token;
    }

    /**
     * Set AI instance credentials
     * @param {string} aiName - AI instance name
     * @param {string} url - AI instance URL
     * @param {string} token - AI instance token
     */
    setAICredentials(aiName, url, token) {
        this.aiInstances.set(aiName, {
            url: url,
            token: token,
            lastUsed: new Date()
        });
    }

    /**
     * Set JWT secret
     * @param {string} secret - JWT secret
     */
    setJWTSecret(secret) {
        this.jwtSecret = secret;
    }

    /**
     * Set token expiry
     * @param {string} expiry - Token expiry time
     */
    setTokenExpiry(expiry) {
        this.tokenExpiry = expiry;
    }

    /**
     * Get config database URL
     * @returns {string|null}
     */
    getConfigUrl() {
        return this.configUrl;
    }

    /**
     * Get config database token
     * @returns {string|null}
     */
    getConfigToken() {
        return this.configToken;
    }

    /**
     * Get AI instance URL
     * @param {string} aiName - AI instance name
     * @returns {string|null}
     */
    getAIUrl(aiName) {
        const instance = this.aiInstances.get(aiName);
        return instance ? instance.url : null;
    }

    /**
     * Get AI instance token
     * @param {string} aiName - AI instance name
     * @returns {string|null}
     */
    getAIToken(aiName) {
        const instance = this.aiInstances.get(aiName);
        if (instance) {
            instance.lastUsed = new Date();
            return instance.token;
        }
        return null;
    }

    /**
     * Get JWT secret
     * @returns {string|null}
     */
    getJWTSecret() {
        return this.jwtSecret;
    }

    /**
     * Get token expiry
     * @returns {string}
     */
    getTokenExpiry() {
        return this.tokenExpiry;
    }

    /**
     * Get all AI instance names
     * @returns {Array<string>}
     */
    getAINames() {
        return Array.from(this.aiInstances.keys());
    }

    /**
     * Check if AI instance exists
     * @param {string} aiName - AI instance name
     * @returns {boolean}
     */
    hasAIInstance(aiName) {
        return this.aiInstances.has(aiName);
    }

    /**
     * Remove AI instance
     * @param {string} aiName - AI instance name
     */
    removeAIInstance(aiName) {
        this.aiInstances.delete(aiName);
    }

    /**
     * Get AI instance info
     * @param {string} aiName - AI instance name
     * @returns {Object|null}
     */
    getAIInstanceInfo(aiName) {
        const instance = this.aiInstances.get(aiName);
        if (instance) {
            return {
                name: aiName,
                url: instance.url,
                hasToken: !!instance.token,
                lastUsed: instance.lastUsed
            };
        }
        return null;
    }

    /**
     * Get all AI instances info
     * @returns {Array<Object>}
     */
    getAllAIInstancesInfo() {
        const instances = [];
        for (const [name, data] of this.aiInstances) {
            instances.push({
                name: name,
                url: data.url,
                hasToken: !!data.token,
                lastUsed: data.lastUsed
            });
        }
        return instances;
    }

    /**
     * Set refresh callback function
     * @param {Function} callback - Callback function to refresh data
     */
    setRefreshCallback(callback) {
        this.refreshCallback = callback;
    }

    /**
     * Refresh KeysVO data using callback
     * @returns {Promise<void>}
     */
    async refresh() {
        try {
            if (this.refreshCallback) {
                await this.refreshCallback();
            }
            this.lastRefresh = new Date();
            console.log('✅ KeysVO refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh KeysVO:', error);
            throw error;
        }
    }

    /**
     * Validate configuration
     * @returns {Array<string>} Array of validation errors
     */
    validate() {
        const errors = [];

        if (!this.configUrl) {
            errors.push('Config database URL is missing');
        }

        if (!this.configToken) {
            errors.push('Config database token is missing');
        }

        if (!this.jwtSecret) {
            errors.push('JWT secret is missing');
        }

        if (this.aiInstances.size === 0) {
            errors.push('No AI instances configured');
        }

        // Validate each AI instance
        for (const [name, instance] of this.aiInstances) {
            if (!instance.url) {
                errors.push(`AI instance ${name} is missing URL`);
            }
            if (!instance.token) {
                errors.push(`AI instance ${name} is missing token`);
            }
        }

        return errors;
    }

    /**
     * Get KeysVO status
     * @returns {Object}
     */
    getStatus() {
        return {
            lastRefresh: this.lastRefresh,
            nextRefresh: new Date(this.lastRefresh.getTime() + this.refreshTimeout),
            configured: this.validate().length === 0,
            aiInstanceCount: this.aiInstances.size,
            hasJWTSecret: !!this.jwtSecret
        };
    }

    /**
     * Clear all data (for testing)
     */
    clear() {
        this.configUrl = null;
        this.configToken = null;
        this.aiInstances.clear();
        this.jwtSecret = null;
        this.tokenExpiry = '24h';
        this.lastRefresh = new Date();
    }

    /**
     * Reset singleton instance (for testing)
     */
    static reset() {
        KeysVO.instance = null;
    }
}

module.exports = KeysVO;