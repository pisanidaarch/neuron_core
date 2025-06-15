// src/data/neuron_db/sender.js

const axios = require('axios');

/**
 * NeuronDB Sender - HTTP client for NeuronDB operations
 */
class NeuronDBSender {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'https://ndb.archoffice.tech';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Execute SNL command
     * @param {string} snlCommand - SNL command to execute
     * @param {string} token - JWT token
     * @returns {Promise<Object>}
     */
    async executeSNL(snlCommand, token) {
        try {
            const response = await this.client.post('/snl', snlCommand, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain'
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Login to NeuronDB
     * @param {string} instance - AI instance name
     * @param {string} username - User email
     * @param {string} password - User password
     * @returns {Promise<string>} JWT token
     */
    async login(instance, username, password) {
        try {
            const response = await this.client.post(`/auth/${instance}`, {
                username,
                password
            });
            return response.data; // Should return JWT token
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Validate token and get permissions
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Token validation response
     */
    async validateToken(token) {
        try {
            const response = await this.client.get('/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Create or update user
     * @param {string} token - JWT token (admin)
     * @param {Object} userData - User data
     * @returns {Promise<Object>}
     */
    async setUser(token, userData) {
        try {
            const response = await this.client.post('/set_user', userData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Change password
     * @param {string} token - JWT token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>}
     */
    async changePassword(token, newPassword) {
        try {
            const response = await this.client.post('/change_password', {
                new_password: newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Remove user
     * @param {string} token - JWT token (admin)
     * @param {string} email - User email to remove
     * @returns {Promise<Object>}
     */
    async removeUser(token, email) {
        try {
            const response = await this.client.delete(`/remove_user/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * View user details
     * @param {string} token - JWT token (admin)
     * @param {string} email - User email
     * @returns {Promise<Object>}
     */
    async viewUser(token, email) {
        try {
            const response = await this.client.get(`/view_user/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * List all users
     * @param {string} token - JWT token (admin)
     * @returns {Promise<Array>}
     */
    async listUsers(token) {
        try {
            const response = await this.client.get('/list_users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Remove user permission
     * @param {string} token - JWT token (admin)
     * @param {string} email - User email
     * @param {string} database - Database name
     * @returns {Promise<Object>}
     */
    async removePermission(token, email, database) {
        try {
            const response = await this.client.delete('/permission/remove', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    email,
                    database
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Set user permission
     * @param {string} token - JWT token (admin)
     * @param {string} email - User email
     * @param {string} database - Database name
     * @param {number} level - Permission level (1-3)
     * @returns {Promise<Object>}
     */
    async setPermission(token, email, database, level) {
        try {
            const response = await this.client.post('/permission/set', {
                email,
                database,
                level
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Create database
     * @param {string} token - JWT token (admin)
     * @param {string} dbName - Database name
     * @returns {Promise<Object>}
     */
    async createDatabase(token, dbName) {
        try {
            const response = await this.client.post('/db/create', {
                db_name: dbName
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * List databases
     * @param {string} token - JWT token (admin)
     * @returns {Promise<Object>}
     */
    async listDatabases(token) {
        try {
            const response = await this.client.get('/db/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Drop database
     * @param {string} token - JWT token (admin)
     * @param {string} dbName - Database name
     * @returns {Promise<Object>}
     */
    async dropDatabase(token, dbName) {
        try {
            const response = await this.client.delete('/db/drop', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    db_name: dbName
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Create namespace
     * @param {string} token - JWT token (admin)
     * @param {string} dbName - Database name
     * @param {string} namespaceName - Namespace name
     * @returns {Promise<Object>}
     */
    async createNamespace(token, dbName, namespaceName) {
        try {
            const response = await this.client.post('/namespace/create', {
                db_name: dbName,
                namespace_name: namespaceName
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * List namespaces
     * @param {string} token - JWT token (admin)
     * @param {string} dbName - Database name
     * @returns {Promise<Object>}
     */
    async listNamespaces(token, dbName) {
        try {
            const response = await this.client.get('/namespace/list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    db_name: dbName
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Drop namespace
     * @param {string} token - JWT token (admin)
     * @param {string} dbName - Database name
     * @param {string} namespaceName - Namespace name
     * @returns {Promise<Object>}
     */
    async dropNamespace(token, dbName, namespaceName) {
        try {
            const response = await this.client.delete('/namespace/drop', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    db_name: dbName,
                    namespace_name: namespaceName
                }
            });
            return response.data;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Handle errors uniformly
     * @param {Error} error
     * @returns {Error}
     */
    _handleError(error) {
        if (error.response) {
            // Server responded with error
            const message = error.response.data?.message || error.response.statusText;
            const err = new Error(`NeuronDB Error: ${message}`);
            err.statusCode = error.response.status;
            err.data = error.response.data;
            return err;
        } else if (error.request) {
            // Request made but no response
            return new Error('NeuronDB: No response from server');
        } else {
            // Something else happened
            return error;
        }
    }
}

module.exports = NeuronDBSender;