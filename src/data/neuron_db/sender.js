// src/data/neuron_db/sender.js

const axios = require('axios');
const { DatabaseError } = require('../../cross/entity/errors');

/**
 * NeuronDBSender - Handles communication with NeuronDB via SNL commands
 */
class NeuronDBSender {
    constructor() {
        this.baseUrl = null;
        this.token = null;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Initialize sender with URL and token
     * @param {string} url - NeuronDB base URL
     * @param {string} token - Authentication token
     */
    initialize(url, token) {
        this.baseUrl = url;
        this.token = token;
    }

    /**
     * Execute SNL command
     * @param {string} snlCommand - SNL command to execute
     * @param {string} customToken - Optional custom token
     * @returns {Promise<Object>} Response data
     */
    async executeSNL(snlCommand, customToken = null) {
        if (!this.baseUrl || !this.token) {
            throw new DatabaseError('NeuronDBSender not initialized');
        }

        try {
            const headers = {
                'Content-Type': 'text/plain',
                'Authorization': `Bearer ${customToken || this.token}`
            };

            const response = await axios.post(
                `${this.baseUrl}/snl`,
                snlCommand,
                {
                    headers,
                    timeout: this.timeout,
                    validateStatus: (status) => status < 500 // Accept 4xx as valid responses
                }
            );

            // Handle different response types
            if (response.status === 200) {
                return this.parseResponse(response.data);
            } else if (response.status === 401) {
                throw new DatabaseError('Authentication failed - invalid token');
            } else if (response.status === 403) {
                throw new DatabaseError('Access forbidden - insufficient permissions');
            } else if (response.status === 400) {
                throw new DatabaseError(`Invalid SNL command: ${response.data || 'Unknown error'}`);
            } else {
                throw new DatabaseError(`Database error: ${response.status} - ${response.statusText}`);
            }

        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }

            // Handle network errors
            if (error.code === 'ECONNREFUSED') {
                throw new DatabaseError('Cannot connect to NeuronDB - connection refused');
            } else if (error.code === 'ETIMEDOUT') {
                throw new DatabaseError('NeuronDB request timeout');
            } else if (error.response) {
                throw new DatabaseError(`Database error: ${error.response.status} - ${error.response.statusText}`);
            } else {
                throw new DatabaseError(`Network error: ${error.message}`);
            }
        }
    }

    /**
     * Parse response data
     * @param {any} data - Response data
     * @returns {any} Parsed data
     * @private
     */
    parseResponse(data) {
        // If data is already an object, return it
        if (typeof data === 'object' && data !== null) {
            return data;
        }

        // If data is a string, try to parse as JSON
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (error) {
                // Return as string if not valid JSON
                return data;
            }
        }

        // Return data as-is for other types
        return data;
    }

    /**
     * Test connection to NeuronDB
     * @returns {Promise<boolean>} True if connection is successful
     */
    async testConnection() {
        try {
            // Simple SNL command to test connection
            const testCommand = 'list(structure)\nvalues("*")\non(main)';
            await this.executeSNL(testCommand);
            return true;
        } catch (error) {
            throw new DatabaseError(`Connection test failed: ${error.message}`);
        }
    }

    /**
     * Login to NeuronDB
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response with token
     */
    async login(email, password) {
        if (!this.baseUrl) {
            throw new DatabaseError('NeuronDBSender not initialized');
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/login`,
                { email, password },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: this.timeout
                }
            );

            if (response.status === 200 && response.data.token) {
                return response.data;
            } else {
                throw new DatabaseError('Login failed - invalid credentials');
            }

        } catch (error) {
            if (error.response?.status === 401) {
                throw new DatabaseError('Login failed - invalid credentials');
            }
            throw new DatabaseError(`Login error: ${error.message}`);
        }
    }

    /**
     * Change password
     * @param {string} email - User email
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Change password response
     */
    async changePassword(email, currentPassword, newPassword) {
        if (!this.baseUrl) {
            throw new DatabaseError('NeuronDBSender not initialized');
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/change-password`,
                { email, currentPassword, newPassword },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: this.timeout
                }
            );

            return response.data;

        } catch (error) {
            if (error.response?.status === 401) {
                throw new DatabaseError('Password change failed - invalid current password');
            }
            throw new DatabaseError(`Password change error: ${error.message}`);
        }
    }

    /**
     * Get sender status
     * @returns {Object} Sender status information
     */
    getStatus() {
        return {
            initialized: !!(this.baseUrl && this.token),
            baseUrl: this.baseUrl,
            hasToken: !!this.token,
            timeout: this.timeout
        };
    }

    /**
     * Set request timeout
     * @param {number} timeout - Timeout in milliseconds
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }

    /**
     * Get current timeout
     * @returns {number} Current timeout in milliseconds
     */
    getTimeout() {
        return this.timeout;
    }

    /**
     * Clear credentials (for security)
     */
    clear() {
        this.baseUrl = null;
        this.token = null;
    }

    /**
     * Close connection (cleanup)
     */
    async close() {
        // No persistent connections to close for HTTP client
        this.clear();
    }
}

module.exports = NeuronDBSender;