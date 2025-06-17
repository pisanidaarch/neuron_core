// src/data/neuron_db/sender.js

const axios = require('axios');
const config = require('../../../config.json');

/**
 * NeuronDB Sender - Base class for NeuronDB communication
 */
class NeuronDBSender {
    constructor() {
        this.configUrl = config.database.config_url;
        this.configToken = config.database.config_token;
    }

    /**
     * Execute SNL command on config database
     */
    async executeSNL(snlCommand, token = null) {
        try {
            const authToken = token || this.configToken;

            const response = await axios.post(
                `${this.configUrl}/snl`,
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
     * Execute authentication command
     */
    async executeAuth(endpoint, payload, token = null) {
        try {
            const url = `${this.configUrl}${endpoint}`;
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
     * Validate token
     */
    async validateToken(token) {
        try {
            const response = await axios.get(
                `${this.configUrl}/auth/validate`,
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
     * Parse SNL response
     */
    parseResponse(response) {
        // SNL responses can be:
        // 1. JSON objects for structures
        // 2. Arrays for enums
        // 3. Strings for pointers/ipointers
        // 4. Success messages for operations

        if (typeof response === 'string') {
            try {
                // Try to parse as JSON first
                return JSON.parse(response);
            } catch {
                // Return as string if not JSON
                return response;
            }
        }

        return response;
    }

    /**
     * Handle errors from NeuronDB
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error
            const status = error.response.status;
            const message = error.response.data?.error || error.response.data || 'Unknown error';

            if (status === 401) {
                return new Error(`Authentication failed: ${message}`);
            } else if (status === 403) {
                return new Error(`Permission denied: ${message}`);
            } else if (status === 404) {
                return new Error(`Resource not found: ${message}`);
            } else if (status === 400) {
                return new Error(`Invalid request: ${message}`);
            } else {
                return new Error(`NeuronDB error (${status}): ${message}`);
            }
        } else if (error.request) {
            // No response received
            return new Error(`No response from NeuronDB: ${error.message}`);
        } else {
            // Request setup error
            return new Error(`Request error: ${error.message}`);
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.configUrl}/health`);
            return response.data;
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    /**
     * Get sender info
     */
    getInfo() {
        return {
            type: 'config',
            url: this.configUrl,
            hasToken: !!this.configToken
        };
    }
}

module.exports = NeuronDBSender;