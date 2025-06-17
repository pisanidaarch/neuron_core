// src/data/neuron_db/sender.js

const axios = require('axios');
const { NeuronDBError, AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * NeuronDB Sender - Handles communication with NeuronDB for config operations
 */
class NeuronDBSender {
    constructor() {
        this.baseUrl = null;
        this.configToken = null;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Initialize sender with config credentials
     * @param {string} baseUrl - NeuronDB base URL
     * @param {string} configToken - Config token
     */
    initialize(baseUrl, configToken) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.configToken = configToken;
    }

    /**
     * Execute SNL command
     * @param {string} snlCommand - SNL command to execute
     * @param {string} token - Token to use (defaults to config token)
     * @returns {Promise<Object>} Response data
     */
    async executeSNL(snlCommand, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.post(`${this.baseUrl}/snl`, {
                command: snlCommand
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const message = error.response.data?.message || error.response.statusText;

                if (status === 401) {
                    throw new AuthenticationError(`Authentication failed: ${message}`);
                } else if (status === 400) {
                    throw new ValidationError(`Invalid request: ${message}`);
                } else if (status === 404) {
                    throw new NeuronDBError(`Resource not found: ${message}`);
                } else {
                    throw new NeuronDBError(`Server error (${status}): ${message}`);
                }
            } else if (error.request) {
                // Request was made but no response received
                throw new NeuronDBError('No response from NeuronDB server');
            } else {
                // Something else happened
                throw new NeuronDBError(`Request error: ${error.message}`);
            }
        }
    }

    /**
     * Create database
     * @param {string} databaseName - Database name
     * @param {string} token - Token to use
     * @returns {Promise<Object>} Response data
     */
    async createDatabase(databaseName, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.post(`${this.baseUrl}/db/create`, {
                name: databaseName
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Create database failed');
        }
    }

    /**
     * Drop database
     * @param {string} databaseName - Database name
     * @param {string} token - Token to use
     * @returns {Promise<Object>} Response data
     */
    async dropDatabase(databaseName, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.post(`${this.baseUrl}/db/drop`, {
                name: databaseName
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Drop database failed');
        }
    }

    /**
     * List databases
     * @param {string} token - Token to use
     * @returns {Promise<Array>} Array of database names
     */
    async listDatabases(token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.get(`${this.baseUrl}/db/list`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'List databases failed');
        }
    }

    /**
     * Create namespace
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @param {string} token - Token to use
     * @returns {Promise<Object>} Response data
     */
    async createNamespace(databaseName, namespaceName, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.post(`${this.baseUrl}/namespace/create`, {
                database: databaseName,
                name: namespaceName
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Create namespace failed');
        }
    }

    /**
     * Drop namespace
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @param {string} token - Token to use
     * @returns {Promise<Object>} Response data
     */
    async dropNamespace(databaseName, namespaceName, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.post(`${this.baseUrl}/namespace/drop`, {
                database: databaseName,
                name: namespaceName
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Drop namespace failed');
        }
    }

    /**
     * List namespaces
     * @param {string} databaseName - Database name
     * @param {string} token - Token to use
     * @returns {Promise<Array>} Array of namespace names
     */
    async listNamespaces(databaseName, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const authToken = token || this.configToken;
            if (!authToken) {
                throw new AuthenticationError('No authentication token available');
            }

            const response = await axios.get(`${this.baseUrl}/namespace/list`, {
                params: { database: databaseName },
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'List namespaces failed');
        }
    }

    /**
     * Test connection to NeuronDB
     * @returns {Promise<boolean>} True if connection is successful
     */
    async testConnection() {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: 5000 // Shorter timeout for health check
            });

            return response.status === 200;

        } catch (error) {
            console.warn('NeuronDB connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Get server info
     * @returns {Promise<Object>} Server information
     */
    async getServerInfo() {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('Sender not initialized');
            }

            const response = await axios.get(`${this.baseUrl}/info`, {
                timeout: 5000
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Get server info failed');
        }
    }

    /**
     * Handle axios errors consistently
     * @private
     */
    _handleError(error, contextMessage = 'Operation failed') {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;

            if (status === 401) {
                return new AuthenticationError(`${contextMessage}: ${message}`);
            } else if (status === 400) {
                return new ValidationError(`${contextMessage}: ${message}`);
            } else if (status === 404) {
                return new NeuronDBError(`${contextMessage}: Resource not found - ${message}`);
            } else {
                return new NeuronDBError(`${contextMessage}: Server error (${status}) - ${message}`);
            }
        } else if (error.request) {
            // Request was made but no response received
            return new NeuronDBError(`${contextMessage}: No response from NeuronDB server`);
        } else {
            // Something else happened
            return new NeuronDBError(`${contextMessage}: ${error.message}`);
        }
    }

    /**
     * Set timeout for requests
     * @param {number} timeout - Timeout in milliseconds
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return {
            baseUrl: this.baseUrl,
            hasToken: !!this.configToken,
            timeout: this.timeout
        };
    }
}

module.exports = NeuronDBSender;