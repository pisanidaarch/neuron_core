// src/cross/entity/keys_vo.js


/**
 * KeysVO - Value Object for managing all system keys and tokens
 * Implements singleton pattern with lazy loading
 */
class KeysVO {
    constructor() {
        if (KeysVO.instance) {
            return KeysVO.instance;
        }

        this.configUrl = null;
        this.configToken = null;
        this.aiInstances = new Map();
        this.jwtSecret = null;
        this.tokenExpiry = '24h';
        this.lastRefresh = null;
        this.refreshTimeout = 60 * 60 * 1000; // 1 hour

        KeysVO.instance = this;
    }

    /**
     * Get singleton instance
     * @returns {Promise<KeysVO>}
     */
    static async getInstance() {
        if (!KeysVO.instance) {
            KeysVO.instance = new KeysVO();
        }

        // Check if refresh is needed
        const now = Date.now();
        if (!KeysVO.instance.lastRefresh ||
            (now - KeysVO.instance.lastRefresh) > KeysVO.instance.refreshTimeout) {
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
        this.lastRefresh = Date.now();
    }

    /**
     * Set AI instance credentials
     * @param {string} aiName - AI instance name
     * @param {string} url - AI database URL
     * @param {string} token - AI database token
     */
    setAICredentials(aiName, url, token) {
        this.aiInstances.set(aiName, {
            name: aiName,
            url: url,
            token: token
        });
        this.lastRefresh = Date.now();
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
     * @param {string} expiry - Token expiry (e.g., '24h', '7d')
     */
    setTokenExpiry(expiry) {
        this.tokenExpiry = expiry;
    }

    /**
     * Get config database token
     * @returns {string|null}
     */
    getConfigToken() {
        return this.configToken;
    }

    /**
     * Get config database URL
     * @returns {string|null}
     */
    getConfigUrl() {
        return this.configUrl;
    }

    /**
     * Get AI instance credentials
     * @param {string} aiName - AI instance name
     * @returns {Object|null}
     */
    getAICredentials(aiName) {
        return this.aiInstances.get(aiName) || null;
    }

    /**
     * Get AI instance token
     * @param {string} aiName - AI instance name
     * @returns {string|null}
     */
    getAIToken(aiName) {
        const credentials = this.getAICredentials(aiName);
        return credentials ? credentials.token : null;
    }

    /**
     * Get AI instance URL
     * @param {string} aiName - AI instance name
     * @returns {string|null}
     */
    getAIUrl(aiName) {
        const credentials = this.getAICredentials(aiName);
        return credentials ? credentials.url : null;
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
    hasAI(aiName) {
        return this.aiInstances.has(aiName);
    }

    /**
     * Refresh instance (can be overridden for dynamic loading)
     * @returns {Promise<void>}
     */
    async refresh() {
        // This method can be overridden by a manager to reload from external source
        this.lastRefresh = Date.now();
        console.log('🔄 KeysVO refreshed');
    }

    /**
     * Validate that all required keys are present
     * @returns {Object}
     */
    validate() {
        const errors = [];

        if (!this.configToken) {
            errors.push('Config token is not set');
        }

        if (!this.configUrl) {
            errors.push('Config URL is not set');
        }

        if (this.aiInstances.size === 0) {
            errors.push('No AI instances configured');
        }

        if (!this.jwtSecret) {
            errors.push('JWT secret is not set');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Clear all data (useful for testing)
     */
    clear() {
        this.configUrl = null;
        this.configToken = null;
        this.aiInstances.clear();
        this.jwtSecret = null;
        this.tokenExpiry = '24h';
        this.lastRefresh = null;
    }

    /**
     * Reset singleton (useful for testing)
     */
    static reset() {
        KeysVO.instance = null;
    }
}

module.exports = KeysVO;