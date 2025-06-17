// src/api/security/controllers/auth_controller.js

const AuthManager = require('../../../data/manager/auth_manager');
const UserGroupManager = require('../../../data/manager/user_group_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const { getInstance } = require('../../../data/manager/keys_vo_manager');
const {
    AuthenticationError,
    ValidationError,
    NotFoundError,
    NeuronDBError
} = require('../../../cross/entity/errors');

/**
 * Auth Controller for NeuronCore Security API
 */
class AuthController {
    constructor() {
        this.authManager = new AuthManager();
        this.groupManager = new UserGroupManager();
    }

    /**
     * Get AI sender for specific AI
     * @param {string} aiName - AI name
     * @returns {Promise<AISender>}
     */
    async getAISender(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();

        const aiUrl = keysVO.getAIUrl(aiName);
        const aiToken = keysVO.getAIToken(aiName);

        if (!aiUrl || !aiToken) {
            throw new NotFoundError(`AI '${aiName}' not found or not configured`);
        }

        const sender = new AISender();
        sender.initialize(aiUrl, aiToken);

        return sender;
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

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize auth manager with AI sender
            this.authManager.initialize(aiSender);

            // Perform login
            const loginResult = await this.authManager.login(username, password);

            res.json({
                error: false,
                message: 'Login successful',
                data: loginResult
            });

        } catch (error) {
            console.error('Login error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
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
    async validateToken(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new ValidationError('Authorization token is required');
            }

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize auth manager with AI sender
            this.authManager.initialize(aiSender);

            // Validate token
            const userInfo = await this.authManager.validateToken(token);

            res.json({
                error: false,
                message: 'Token is valid',
                data: {
                    valid: true,
                    user: userInfo
                }
            });

        } catch (error) {
            console.error('Token validation error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message,
                    data: { valid: false }
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
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
            const { aiName } = req.params;
            const { newPassword } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new ValidationError('Authorization token is required');
            }

            if (!newPassword) {
                throw new ValidationError('New password is required');
            }

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize auth manager with AI sender
            this.authManager.initialize(aiSender);

            // Change password
            const result = await this.authManager.changePassword(token, newPassword);

            res.json({
                error: false,
                message: 'Password changed successfully',
                data: result
            });

        } catch (error) {
            console.error('Change password error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Password change failed'
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
            const { email, password, nick } = req.body;
            const adminToken = req.headers.authorization?.replace('Bearer ', '');

            if (!adminToken) {
                throw new ValidationError('Authorization token is required');
            }

            if (!email || !password || !nick) {
                throw new ValidationError('Email, password, and nick are required');
            }

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize managers with AI sender
            this.authManager.initialize(aiSender);
            this.groupManager.initialize(aiSender);

            // Prepare user data
            const userData = {
                email,
                password,
                nick,
                permissions: {
                    main: 1 // Default read permission
                }
            };

            // Create user
            const result = await this.authManager.createUser(adminToken, userData);

            res.json({
                error: false,
                message: 'User created successfully',
                data: result
            });

        } catch (error) {
            console.error('Create user error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'User creation failed'
                });
            }
        }
    }

    /**
     * Get current user endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getCurrentUser(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new ValidationError('Authorization token is required');
            }

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize auth manager with AI sender
            this.authManager.initialize(aiSender);

            // Get user info
            const userInfo = await this.authManager.validateToken(token);

            res.json({
                error: false,
                message: 'User information retrieved',
                data: {
                    user: userInfo
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get user information'
                });
            }
        }
    }

    /**
     * Logout endpoint (for completeness, JWT is stateless)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async logout(req, res) {
        try {
            // JWT is stateless, so logout is mainly client-side
            // Could implement token blacklisting in the future

            res.json({
                error: false,
                message: 'Logout successful',
                data: {
                    message: 'Please remove the token from client storage'
                }
            });

        } catch (error) {
            console.error('Logout error:', error);

            res.status(500).json({
                error: true,
                message: 'Logout failed'
            });
        }
    }

    /**
     * Refresh token endpoint (for future implementation)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async refreshToken(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new ValidationError('Authorization token is required');
            }

            // Get AI sender
            const aiSender = await this.getAISender(aiName);

            // Initialize auth manager with AI sender
            this.authManager.initialize(aiSender);

            // Validate current token first
            const userInfo = await this.authManager.validateToken(token);

            // For now, return the same token (could implement refresh logic)
            res.json({
                error: false,
                message: 'Token refreshed',
                data: {
                    token: token,
                    user: userInfo,
                    expiresIn: '24h'
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);

            if (error instanceof ValidationError) {
                res.status(400).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Token refresh failed'
                });
            }
        }
    }
}

module.exports = AuthController;