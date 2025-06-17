// src/cross/entity/keys_vo.js

/**
 * KeysVO - Value Object for managing all system keys and tokens
 * Implements singleton pattern with lazy loading
 * Now supports dynamic refresh from database
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
        this.refreshCallback = null; // Callback for dynamic refresh

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
     * Set refresh callback for dynamic token loading
     * @param {Function} callback - Async function to refresh tokens
     */
    setRefreshCallback(callback) {
        this.refreshCallback = callback;
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
            token: token,
            lastUpdated: Date.now()
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
     * Refresh instance - reload tokens from database
     * @returns {Promise<void>}
     */
    async refresh() {
        try {
            // If a refresh callback is set, use it
            if (this.refreshCallback && typeof this.refreshCallback === 'function') {
                await this.refreshCallback();
            }

            this.lastRefresh = Date.now();
            console.log('🔄 KeysVO refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh KeysVO:', error);
            // Don't throw - keep using cached values
        }
    }

    /**
     * Force refresh - bypass timeout check
     * @returns {Promise<void>}
     */
    async forceRefresh() {
        this.lastRefresh = 0; // Reset to force refresh
        await this.refresh();
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

        // AI instances are now optional as they can be loaded dynamically
        if (this.aiInstances.size === 0) {
            console.warn('⚠️  No AI instances configured - will be loaded from database');
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
     * Get instance info for debugging
     * @returns {Object}
     */
    getInfo() {
        return {
            configUrl: this.configUrl,
            hasConfigToken: !!this.configToken,
            aiInstances: Array.from(this.aiInstances.entries()).map(([name, data]) => ({
                name,
                url: data.url,
                hasToken: !!data.token,
                lastUpdated: data.lastUpdated
            })),
            hasJWTSecret: !!this.jwtSecret,
            tokenExpiry: this.tokenExpiry,
            lastRefresh: this.lastRefresh,
            refreshTimeout: this.refreshTimeout
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
        this.refreshCallback = null;
    }

    /**
     * Reset singleton (useful for testing)
     */
    static reset() {
        KeysVO.instance = null;
    }
}

module.exports = KeysVO;