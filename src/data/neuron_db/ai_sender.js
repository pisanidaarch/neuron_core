// src/data/neuron_db/ai_sender.js

const NeuronDBSender = require('./sender');
const config = require('../../../config.json');

/**
 * AI Sender - Sender for specific AI instances
 * Extends NeuronDBSender to use AI-specific configuration
 */
class AISender extends NeuronDBSender {
    constructor(aiName) {
        super();

        if (!aiName) {
            throw new Error('AI name is required');
        }

        const aiConfig = config.ai_instances[aiName];
        if (!aiConfig) {
            throw new Error(`AI instance '${aiName}' not found in configuration`);
        }

        this.aiName = aiName;
        this.aiUrl = aiConfig.url;
        this.aiToken = aiConfig.token;
    }

    /**
     * Execute SNL command on AI database
     * Overrides parent to use AI-specific URL and token
     */
    async executeSNL(snlCommand, token = null) {
        try {
            const authToken = token || this.aiToken;

            const response = await axios.post(
                `${this.aiUrl}/snl`,
                snlCommand,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'text/plain'
                    }
                }
            );

            return this.parseResponse(response.data);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Execute authentication command on AI instance
     * Overrides parent to use AI-specific URL
     */
    async executeAuth(endpoint, payload, token = null) {
        try {
            const url = `${this.aiUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(url, payload, { headers });
            return response.data;

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate token on AI instance
     * Overrides parent to use AI-specific URL
     */
    async validateToken(token) {
        try {
            const response = await axios.get(
                `${this.aiUrl}/auth/validate`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Health check for AI instance
     * Overrides parent to use AI-specific URL
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.aiUrl}/health`);
            return {
                ...response.data,
                aiName: this.aiName
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                aiName: this.aiName
            };
        }
    }

    /**
     * Get sender info
     * Overrides parent to include AI-specific info
     */
    getInfo() {
        return {
            type: 'ai',
            aiName: this.aiName,
            url: this.aiUrl,
            hasToken: !!this.aiToken
        };
    }

    /**
     * Get available AI instances from config
     */
    static getAvailableInstances() {
        return Object.keys(config.ai_instances || {});
    }

    /**
     * Check if AI instance exists in config
     */
    static instanceExists(aiName) {
        return !!(config.ai_instances && config.ai_instances[aiName]);
    }
}

// Required for AISender
const axios = require('axios');

module.exports = AISender;