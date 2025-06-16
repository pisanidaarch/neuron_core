// src/data/neuron_db/ai_sender.js

const axios = require('axios');
const { getInstance } = require('../manager/keys_vo_manager');

/**
 * AISender - Handles communication with AI-specific NeuronDB instances
 */
class AISender {
    constructor() {
        this.keysManager = getInstance();
    }

    /**
     * Execute SNL command for specific AI
     * @param {string} snlCommand - SNL command
     * @param {string} aiToken - AI-specific token
     * @returns {Promise<Object>}
     */
    async executeSNL(snlCommand, aiToken) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            // Find AI instance by token
            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.post(`${aiUrl}/snl`, snlCommand, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                throw new Error(`SNL execution failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                // Network error
                throw new Error('SNL execution failed: Network error');
            } else {
                // Other error
                throw new Error(`SNL execution failed: ${error.message}`);
            }
        }
    }

    /**
     * Create user in AI database
     * @param {string} aiToken - AI token
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {string} email - Email
     * @param {Array} groups - User groups
     * @returns {Promise<Object>}
     */
    async createUser(aiToken, username, password, email, groups = ['default']) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const userData = {
                username,
                password,
                email,
                groups,
                active: true,
                createdAt: new Date().toISOString()
            };

            const response = await axios.post(`${aiUrl}/user/create`, userData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`User creation failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('User creation failed: Network error');
            } else {
                throw new Error(`User creation failed: ${error.message}`);
            }
        }
    }

    /**
     * Login user
     * @param {string} aiToken - AI token
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<string>} JWT token
     */
    async login(aiToken, username, password) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.post(`${aiUrl}/auth/login`, {
                username,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return response.data.token;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new Error('Invalid credentials');
            } else if (error.response) {
                throw new Error(`Login failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Login failed: Network error');
            } else {
                throw new Error(`Login failed: ${error.message}`);
            }
        }
    }

    /**
     * Validate token
     * @param {string} token - JWT token to validate
     * @returns {Promise<Object>} User information
     */
    async validateToken(token) {
        try {
            // Extract AI token from the JWT or get from context
            // For now, we'll need to try each AI until we find the right one
            const keysVO = await this.keysManager.getKeysVO();

            for (const aiName of keysVO.getAINames()) {
                try {
                    const aiUrl = keysVO.getAIUrl(aiName);

                    const response = await axios.post(`${aiUrl}/auth/validate`, {}, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        timeout: 15000
                    });

                    return response.data;
                } catch (error) {
                    // Try next AI if this one fails
                    continue;
                }
            }

            throw new Error('Token validation failed on all AI instances');
        } catch (error) {
            throw new Error(`Token validation failed: ${error.message}`);
        }
    }

    /**
     * Change user password
     * @param {string} aiToken - AI token
     * @param {string} username - Username
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>}
     */
    async changePassword(aiToken, username, currentPassword, newPassword) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.post(`${aiUrl}/auth/change-password`, {
                username,
                currentPassword,
                newPassword
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data.success || true;
        } catch (error) {
            if (error.response) {
                throw new Error(`Password change failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Password change failed: Network error');
            } else {
                throw new Error(`Password change failed: ${error.message}`);
            }
        }
    }

    /**
     * Create database
     * @param {string} aiToken - AI token (must be admin)
     * @param {string} databaseName - Database name
     * @returns {Promise<boolean>}
     */
    async createDatabase(aiToken, databaseName) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.post(`${aiUrl}/database/create`, {
                name: databaseName
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data.success || true;
        } catch (error) {
            if (error.response) {
                throw new Error(`Database creation failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Database creation failed: Network error');
            } else {
                throw new Error(`Database creation failed: ${error.message}`);
            }
        }
    }

    /**
     * Delete database
     * @param {string} aiToken - AI token (must be admin)
     * @param {string} databaseName - Database name
     * @returns {Promise<boolean>}
     */
    async deleteDatabase(aiToken, databaseName) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.delete(`${aiUrl}/database/${databaseName}`, {
                headers: {
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data.success || true;
        } catch (error) {
            if (error.response) {
                throw new Error(`Database deletion failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Database deletion failed: Network error');
            } else {
                throw new Error(`Database deletion failed: ${error.message}`);
            }
        }
    }

    /**
     * List databases
     * @param {string} aiToken - AI token
     * @returns {Promise<Array>}
     */
    async listDatabases(aiToken) {
        try {
            // Get AI URL from keys
            const keysVO = await this.keysManager.getKeysVO();

            let aiUrl = null;
            for (const aiName of keysVO.getAINames()) {
                if (keysVO.getAIToken(aiName) === aiToken) {
                    aiUrl = keysVO.getAIUrl(aiName);
                    break;
                }
            }

            if (!aiUrl) {
                throw new Error('AI instance not found for provided token');
            }

            const response = await axios.get(`${aiUrl}/database/list`, {
                headers: {
                    'Authorization': `Bearer ${aiToken}`
                },
                timeout: 30000
            });

            return response.data.databases || [];
        } catch (error) {
            if (error.response) {
                throw new Error(`Database list failed: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Database list failed: Network error');
            } else {
                throw new Error(`Database list failed: ${error.message}`);
            }
        }
    }
}

module.exports = AISender;