// src/data/neuron_db/ai_sender.js

const axios = require('axios');
const { NeuronDBError, AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * AI Sender - Handles communication with NeuronDB for AI-specific operations
 */
class AISender {
    constructor() {
        this.baseUrl = null;
        this.aiToken = null;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Initialize sender with AI credentials
     * @param {string} baseUrl - NeuronDB base URL
     * @param {string} aiToken - AI token
     */
    initialize(baseUrl, aiToken) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.aiToken = aiToken;
    }

    /**
     * Execute SNL command
     * @param {string} snlCommand - SNL command to execute
     * @param {string} token - Token to use (optional, defaults to AI token)
     * @returns {Promise<Object>} Response data
     */
    async executeSNL(snlCommand, token = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            const authToken = token || this.aiToken;
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
            throw this._handleError(error, 'SNL execution failed');
        }
    }

    /**
     * Login user
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {Promise<Object>} Login result with token
     */
    async login(username, password) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!username || !password) {
                throw new ValidationError('Username and password are required');
            }

            const response = await axios.post(`${this.baseUrl}/auth/login`, {
                username,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Login failed');
        }
    }

    /**
     * Validate token and get user info
     * @param {string} token - JWT token to validate
     * @returns {Promise<Object>} User information
     */
    async validateToken(token) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!token) {
                throw new ValidationError('Token is required');
            }

            const response = await axios.post(`${this.baseUrl}/auth/validate`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Token validation failed');
        }
    }

    /**
     * Change user password
     * @param {string} token - User token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Success result
     */
    async changePassword(token, newPassword) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!token || !newPassword) {
                throw new ValidationError('Token and new password are required');
            }

            const response = await axios.post(`${this.baseUrl}/auth/changepwd`, {
                newPassword
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Password change failed');
        }
    }

    /**
     * Create new user
     * @param {string} adminToken - Admin token (optional for system operations)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Creation result
     */
    async createUser(adminToken, userData) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!userData || !userData.email || !userData.password) {
                throw new ValidationError('User data with email and password are required');
            }

            const requestData = {
                email: userData.email,
                password: userData.password,
                nick: userData.nick || userData.email.split('@')[0],
                permissions: userData.permissions || {}
            };

            const headers = {
                'Content-Type': 'application/json'
            };

            // Use admin token if provided, otherwise use AI token for system operations
            const authToken = adminToken || this.aiToken;
            if (authToken) {
                headers.Authorization = `Bearer ${authToken}`;
            }

            const response = await axios.post(`${this.baseUrl}/auth/createuser`, requestData, {
                headers,
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'User creation failed');
        }
    }

    /**
     * Get user permissions
     * @param {string} token - User token
     * @returns {Promise<Object>} User permissions
     */
    async getUserPermissions(token) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!token) {
                throw new ValidationError('Token is required');
            }

            const response = await axios.get(`${this.baseUrl}/auth/permissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Get permissions failed');
        }
    }

    /**
     * Set user permissions
     * @param {string} adminToken - Admin token
     * @param {string} userEmail - User email
     * @param {Object} permissions - Permissions object
     * @returns {Promise<Object>} Success result
     */
    async setUserPermissions(adminToken, userEmail, permissions) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            if (!adminToken || !userEmail || !permissions) {
                throw new ValidationError('Admin token, user email, and permissions are required');
            }

            const response = await axios.post(`${this.baseUrl}/auth/setpermissions`, {
                email: userEmail,
                permissions
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                timeout: this.timeout
            });

            return response.data;

        } catch (error) {
            throw this._handleError(error, 'Set permissions failed');
        }
    }

    /**
     * Create database (admin operation)
     * @param {string} databaseName - Database name
     * @param {string} adminToken - Admin token (optional, uses AI token if not provided)
     * @returns {Promise<Object>} Response data
     */
    async createDatabase(databaseName, adminToken = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            const authToken = adminToken || this.aiToken;
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
     * Create namespace (admin operation)
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @param {string} adminToken - Admin token (optional, uses AI token if not provided)
     * @returns {Promise<Object>} Response data
     */
    async createNamespace(databaseName, namespaceName, adminToken = null) {
        try {
            if (!this.baseUrl) {
                throw new NeuronDBError('AI Sender not initialized');
            }

            const authToken = adminToken || this.aiToken;
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
     * Test connection to NeuronDB
     * @returns {Promise<boolean>} True if connection is successful
     */
    async testConnection() {
        try {
            if (!this.baseUrl) {
                return false;
            }

            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: 5000 // Shorter timeout for health check
            });

            return response.status === 200;

        } catch (error) {
            console.warn('NeuronDB AI connection test failed:', error.message);
            return false;
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
            } else if (status === 403) {
                return new AuthenticationError(`${contextMessage}: Permission denied - ${message}`);
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
            hasToken: !!this.aiToken,
            timeout: this.timeout
        };
    }

    /**
     * Update AI token
     * @param {string} newToken - New AI token
     */
    updateToken(newToken) {
        this.aiToken = newToken;
    }
}

module.exports = AISender;