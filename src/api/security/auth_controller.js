// src/api/security/auth_controller.js

const { getInstance } = require('../../data/manager/keys_vo_manager');
const UserManager = require('../../data/manager/user_manager');
const UserGroupManager = require('../../data/manager/user_group_manager');
const SubscriptionManager = require('../../data/manager/subscription_manager');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * Authentication Controller for NeuronCore Security API
 */
class AuthController {
    constructor() {
        this.sender = new NeuronDBSender();
    }

    /**
     * Get AI token for operations
     * @param {string} aiName - AI name
     * @returns {Promise<string>}
     */
    async getAIToken(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        return keysVO.getAIToken(aiName);
    }

    /**
     * Login endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async login(req, res) {
        try {
            const { aiName } = req.params;
            const { username, password } = req.body;

            if (!username || !password) {
                throw new ValidationError('Username and password are required');
            }

            // Use NeuronDB login directly
            const token = await this.sender.login(aiName, username, password);

            res.json({
                error: false,
                data: {
                    token: token,
                    user: username
                }
            });

        } catch (error) {
            console.error('Login error:', error);

            if (error.statusCode === 401) {
                res.status(401).json({
                    error: true,
                    message: 'Invalid credentials'
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Login failed'
                });
            }
        }
    }

    /**
     * Validate token endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async validate(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token using NeuronDB
            const validation = await this.sender.validateToken(token);

            res.json({
                error: false,
                data: validation
            });

        } catch (error) {
            console.error('Token validation error:', error);

            if (error.statusCode === 401) {
                res.status(401).json({
                    error: true,
                    message: 'Invalid or expired token'
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Token validation failed'
                });
            }
        }
    }

    /**
     * Change password endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async changePassword(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { newPassword } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!newPassword || newPassword.length < 6) {
                throw new ValidationError('New password must be at least 6 characters');
            }

            // Change password using NeuronDB
            await this.sender.changePassword(token, newPassword);

            res.json({
                error: false,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);

            if (error.statusCode === 401) {
                res.status(401).json({
                    error: true,
                    message: 'Invalid or expired token'
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to change password'
                });
            }
        }
    }

    /**
     * Create user endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createUser(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, password, nick } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !password || !nick) {
                throw new ValidationError('Email, password, and nick are required');
            }

            // Validate admin permissions
            const validation = await this.sender.validateToken(token);
            const isAdmin = validation.permissions?.some(p =>
                p.database === 'main' && p.level >= 3
            );

            if (!isAdmin) {
                throw new AuthenticationError('Admin permissions required');
            }

            // Get AI token for user creation
            const aiToken = await this.getAIToken(aiName);

            // Create user using NeuronDB
            const userData = {
                email,
                password,
                nick,
                roles: {
                    permissions: {
                        main: 1 // Default read permission
                    }
                }
            };

            await this.sender.setUser(aiToken, userData);

            // Add user to default group
            const userGroupManager = new UserGroupManager(aiToken);
            await userGroupManager.addMemberToGroup('default', email);

            res.json({
                error: false,
                message: 'User created successfully',
                data: {
                    email,
                    nick
                }
            });

        } catch (error) {
            console.error('Create user error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to create user'
                });
            }
        }
    }

    /**
     * Get permissions endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getPermissions(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Get permissions using NeuronDB validate
            const validation = await this.sender.validateToken(token);

            res.json({
                error: false,
                data: {
                    user: validation.sub || validation.username,
                    permissions: validation.permissions || []
                }
            });

        } catch (error) {
            console.error('Get permissions error:', error);

            if (error.statusCode === 401) {
                res.status(401).json({
                    error: true,
                    message: 'Invalid or expired token'
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get permissions'
                });
            }
        }
    }

    /**
     * Set permission endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async setPermission(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, database, level } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !database || !level) {
                throw new ValidationError('Email, database, and level are required');
            }

            if (![1, 2, 3].includes(level)) {
                throw new ValidationError('Level must be 1 (read), 2 (write), or 3 (admin)');
            }

            // Validate admin permissions
            const validation = await this.sender.validateToken(token);
            const isAdmin = validation.permissions?.some(p =>
                p.database === 'main' && p.level >= 3
            );

            if (!isAdmin) {
                throw new AuthenticationError('Admin permissions required');
            }

            // Get AI token for permission setting
            const aiToken = await this.getAIToken(aiName);

            // Set permission using NeuronDB
            await this.sender.setPermission(aiToken, email, database, level);

            res.json({
                error: false,
                message: 'Permission set successfully'
            });

        } catch (error) {
            console.error('Set permission error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to set permission'
                });
            }
        }
    }
}

module.exports = AuthController;