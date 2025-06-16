// src/api/security/controllers/auth_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const UserManager = require('../../../data/manager/user_manager');
const UserGroupManager = require('../../../data/manager/user_group_manager');
const SubscriptionManager = require('../../../data/manager/subscription_manager');
const TimelineManager = require('../../../data/manager/timeline_manager');
const NeuronDBSender = require('../../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../../cross/entity/errors');

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

            // Log security action
            try {
                const aiToken = await this.getAIToken(aiName);
                const timelineManager = new TimelineManager(aiToken);
                await timelineManager.logSecurityAction(
                    username, // Assuming username is email for now
                    aiName,
                    'user_login',
                    {
                        username,
                        loginTime: new Date().toISOString(),
                        userAgent: req.headers['user-agent'],
                        ip: req.ip || req.connection.remoteAddress
                    }
                );
            } catch (timelineError) {
                console.warn('Failed to log login action to timeline:', timelineError.message);
            }

            res.json({
                error: false,
                data: {
                    token: token,
                    user: username,
                    aiName: aiName,
                    loginTime: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Login error:', error);

            if (error.message.includes('Invalid credentials')) {
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
    async validateToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            res.json({
                error: false,
                data: {
                    valid: true,
                    user: {
                        username: userInfo.username,
                        email: userInfo.email,
                        groups: userInfo.groups || [],
                        permissions: userInfo.permissions || [],
                        aiName: userInfo.aiName
                    },
                    validatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Token validation error:', error);

            res.status(401).json({
                error: true,
                message: 'Invalid or expired token'
            });
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
            const { username, currentPassword, newPassword } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!username || !currentPassword || !newPassword) {
                throw new ValidationError('Username, current password, and new password are required');
            }

            // Validate new password strength
            if (newPassword.length < 8) {
                throw new ValidationError('New password must be at least 8 characters long');
            }

            // Validate token and check if user can change this password
            const userInfo = await this.sender.validateToken(token);

            // Users can only change their own password unless they are admin
            if (userInfo.username !== username && !userInfo.groups?.includes('admin')) {
                throw new AuthenticationError('You can only change your own password');
            }

            // Change password
            await this.sender.changePassword(aiName, username, currentPassword, newPassword);

            // Log security action
            try {
                const aiToken = await this.getAIToken(aiName);
                const timelineManager = new TimelineManager(aiToken);
                await timelineManager.logSecurityAction(
                    userInfo.email || username,
                    aiName,
                    'password_changed',
                    {
                        targetUser: username,
                        changedBy: userInfo.username,
                        changeTime: new Date().toISOString()
                    }
                );
            } catch (timelineError) {
                console.warn('Failed to log password change to timeline:', timelineError.message);
            }

            res.json({
                error: false,
                message: 'Password changed successfully',
                data: {
                    username: username,
                    changedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Change password error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
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
     * Logout endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async logout(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Get user info before logout
            const userInfo = await this.sender.validateToken(token);

            // Log security action
            try {
                const aiToken = await this.getAIToken(aiName);
                const timelineManager = new TimelineManager(aiToken);
                await timelineManager.logSecurityAction(
                    userInfo.email || userInfo.username,
                    aiName,
                    'user_logout',
                    {
                        username: userInfo.username,
                        logoutTime: new Date().toISOString()
                    }
                );
            } catch (timelineError) {
                console.warn('Failed to log logout action to timeline:', timelineError.message);
            }

            // Note: In a real implementation, you might want to blacklist the token
            // For now, we just return success
            res.json({
                error: false,
                message: 'Logged out successfully',
                data: {
                    username: userInfo.username,
                    logoutTime: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Logout error:', error);

            // Even if logout fails, we return success for security
            res.json({
                error: false,
                message: 'Logged out successfully',
                data: {
                    logoutTime: new Date().toISOString()
                }
            });
        }
    }

    /**
     * Refresh token endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async refreshToken(req, res) {
        try {
            const { aiName } = req.params;
            const { refreshToken } = req.body;
            const currentToken = req.headers.authorization?.replace('Bearer ', '');

            if (!currentToken && !refreshToken) {
                throw new AuthenticationError('Current token or refresh token is required');
            }

            // Validate current token
            const userInfo = await this.sender.validateToken(currentToken || refreshToken);

            // In a real implementation, you would generate a new token
            // For now, we'll return the same token with updated timestamp
            res.json({
                error: false,
                message: 'Token refreshed successfully',
                data: {
                    token: currentToken || refreshToken,
                    user: userInfo.username,
                    refreshedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);

            res.status(401).json({
                error: true,
                message: 'Token refresh failed'
            });
        }
    }

    /**
     * Get current user info endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getCurrentUser(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Get user info
            const userInfo = await this.sender.validateToken(token);

            res.json({
                error: false,
                data: {
                    username: userInfo.username,
                    email: userInfo.email,
                    groups: userInfo.groups || [],
                    permissions: userInfo.permissions || [],
                    aiName: userInfo.aiName,
                    lastValidated: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get current user error:', error);

            res.status(401).json({
                error: true,
                message: 'Failed to get user information'
            });
        }
    }
}

module.exports = AuthController;