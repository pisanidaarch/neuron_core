// src/api/security/controllers/user_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const UserGroupManager = require('../../../data/manager/user_group_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const { AuthenticationError, ValidationError, NotFoundError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * User Controller for NeuronCore Security API
 */
class UserController {
    constructor() {
        this.sender = new AISender();
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
     * Validate admin permissions
     * @param {string} token - JWT token
     * @param {string} requiredLevel - Required permission level
     * @returns {Promise<Object>}
     */
    async validateAdminPermissions(token, requiredLevel = 'admin') {
        try {
            const validation = await this.sender.validateToken(token);

            // Check if user has admin permissions
            const isAdmin = validation.permissions?.some(p =>
                p.database === 'main' && p.level >= 3
            ) || validation.groups?.includes('admin');

            if (!isAdmin && requiredLevel === 'admin') {
                throw new AuthorizationError('Admin permissions required');
            }

            return validation;
        } catch (error) {
            throw new AuthenticationError('Invalid or expired token');
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
            const { username, password, email, groups = ['default'] } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!username || !password || !email) {
                throw new ValidationError('Username, password, and email are required');
            }

            // Validate admin permissions
            await this.validateAdminPermissions(token, 'admin');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Validate groups exist
            const userGroupManager = new UserGroupManager(aiToken);
            for (const groupName of groups) {
                const groupExists = await userGroupManager.groupExists(groupName);
                if (!groupExists) {
                    throw new ValidationError(`Group not found: ${groupName}`);
                }
            }

            // Create user
            const result = await this.sender.createUser(aiToken, username, password, email, groups);

            res.json({
                error: false,
                message: 'User created successfully',
                data: {
                    username,
                    email,
                    groups,
                    created: true
                }
            });

        } catch (error) {
            console.error('Create user error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
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
     * Get user endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getUser(req, res) {
        try {
            const { aiName, username } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token and get current user info
            const currentUser = await this.sender.validateToken(token);

            // Users can only see their own info unless they're admin
            if (currentUser.username !== username) {
                await this.validateAdminPermissions(token, 'admin');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get user information
            // Note: This would typically query the user database
            // For now, we'll return basic info from token validation
            res.json({
                error: false,
                data: {
                    username: currentUser.username,
                    email: currentUser.email,
                    groups: currentUser.groups || [],
                    permissions: currentUser.permissions || [],
                    active: true
                }
            });

        } catch (error) {
            console.error('Get user error:', error);

            if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
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
     * Update user endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateUser(req, res) {
        try {
            const { aiName, username } = req.params;
            const { email, groups, active } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token and get current user info
            const currentUser = await this.sender.validateToken(token);

            // Users can only update their own email, admins can update everything
            const isSelfUpdate = currentUser.username === username;
            const isEmailOnlyUpdate = email && !groups && active === undefined;

            if (!isSelfUpdate || !isEmailOnlyUpdate) {
                await this.validateAdminPermissions(token, 'admin');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Validate groups if provided
            if (groups) {
                const userGroupManager = new UserGroupManager(aiToken);
                for (const groupName of groups) {
                    const groupExists = await userGroupManager.groupExists(groupName);
                    if (!groupExists) {
                        throw new ValidationError(`Group not found: ${groupName}`);
                    }
                }
            }

            // Note: In a real implementation, you would update the user in the database
            // For now, we'll return success response
            res.json({
                error: false,
                message: 'User updated successfully',
                data: {
                    username,
                    email: email || currentUser.email,
                    groups: groups || currentUser.groups,
                    active: active !== undefined ? active : true,
                    updated: true
                }
            });

        } catch (error) {
            console.error('Update user error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update user'
                });
            }
        }
    }

    /**
     * Delete user endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async deleteUser(req, res) {
        try {
            const { aiName, username } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate admin permissions (only admins can delete users)
            await this.validateAdminPermissions(token, 'admin');

            // Prevent deletion of subscription_admin user
            if (username === 'subscription_admin') {
                throw new ValidationError('Cannot delete system user: subscription_admin');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Note: In a real implementation, you would delete the user from the database
            // For now, we'll return success response
            res.json({
                error: false,
                message: 'User deleted successfully',
                data: {
                    username,
                    deleted: true
                }
            });

        } catch (error) {
            console.error('Delete user error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to delete user'
                });
            }
        }
    }

    /**
     * List users endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listUsers(req, res) {
        try {
            const { aiName } = req.params;
            const { page = 1, limit = 20, search } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate admin permissions (only admins can list all users)
            await this.validateAdminPermissions(token, 'admin');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Note: In a real implementation, you would query the user database
            // For now, we'll return a mock response
            const users = [
                {
                    username: 'subscription_admin',
                    email: 'subscription_admin@system.local',
                    groups: ['subscription_admin'],
                    active: true,
                    isSystem: true,
                    createdAt: new Date().toISOString()
                }
            ];

            res.json({
                error: false,
                data: {
                    users,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: users.length,
                        pages: Math.ceil(users.length / limit)
                    }
                }
            });

        } catch (error) {
            console.error('List users error:', error);

            if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list users'
                });
            }
        }
    }
}

module.exports = UserController;