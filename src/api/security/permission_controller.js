// src/api/security/permission_controller.js

const { getInstance } = require('../../data/manager/keys_vo_manager');
const UserGroupManager = require('../../data/manager/user_group_manager');
const UserManager = require('../../data/manager/user_manager');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * Permission Controller for NeuronCore Security API
 */
class PermissionController {
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
     * Validate admin permissions
     * @param {string} token - JWT token
     * @returns {Promise<Object>}
     */
    async validateAdminPermissions(token) {
        const validation = await this.sender.validateToken(token);
        const isAdmin = validation.permissions?.some(p =>
            p.database === 'main' && p.level >= 3
        );

        if (!isAdmin) {
            throw new AuthenticationError('Admin permissions required');
        }

        return validation;
    }

    /**
     * List groups endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listGroups(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get groups
            const userGroupManager = new UserGroupManager(aiToken);
            const groups = await userGroupManager.getVisibleGroups(); // Only visible groups

            res.json({
                error: false,
                data: groups.map(group => ({
                    name: group.name,
                    description: group.description,
                    member_count: group.getMemberCount(),
                    system_group: group.system_group
                }))
            });

        } catch (error) {
            console.error('List groups error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list groups'
                });
            }
        }
    }

    /**
     * Create group endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createGroup(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { groupName, description } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!groupName) {
                throw new ValidationError('Group name is required');
            }

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create group
            const userGroupManager = new UserGroupManager(aiToken);
            const group = await userGroupManager.createGroup(groupName, description || '');

            res.json({
                error: false,
                message: 'Group created successfully',
                data: {
                    name: group.name,
                    description: group.description
                }
            });

        } catch (error) {
            console.error('Create group error:', error);

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
                    message: 'Failed to create group'
                });
            }
        }
    }

    /**
     * Add user to group endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async addUserToGroup(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, groupName } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !groupName) {
                throw new ValidationError('Email and group name are required');
            }

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Check if user exists
            const userManager = new UserManager(aiToken);
            const userExists = await userManager.userExists(email);
            if (!userExists) {
                throw new NotFoundError('User', email);
            }

            // Add user to group
            const userGroupManager = new UserGroupManager(aiToken);
            const success = await userGroupManager.addMemberToGroup(groupName, email);

            if (!success) {
                throw new Error('Failed to add user to group');
            }

            res.json({
                error: false,
                message: 'User added to group successfully'
            });

        } catch (error) {
            console.error('Add user to group error:', error);

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
            } else if (error instanceof NotFoundError) {
                res.status(404).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to add user to group'
                });
            }
        }
    }

    /**
     * Remove user from group endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async removeUserFromGroup(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, groupName } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !groupName) {
                throw new ValidationError('Email and group name are required');
            }

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Remove user from group
            const userGroupManager = new UserGroupManager(aiToken);
            const success = await userGroupManager.removeMemberFromGroup(groupName, email);

            if (!success) {
                throw new Error('Failed to remove user from group');
            }

            res.json({
                error: false,
                message: 'User removed from group successfully'
            });

        } catch (error) {
            console.error('Remove user from group error:', error);

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
                    message: 'Failed to remove user from group'
                });
            }
        }
    }

    /**
     * Get group members endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getGroupMembers(req, res) {
        try {
            const { aiName, groupName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get group members
            const userGroupManager = new UserGroupManager(aiToken);
            const members = await userGroupManager.getGroupMembers(groupName);

            res.json({
                error: false,
                data: {
                    group: groupName,
                    members: members
                }
            });

        } catch (error) {
            console.error('Get group members error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get group members'
                });
            }
        }
    }

    /**
     * Get user groups endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getUserGroups(req, res) {
        try {
            const { aiName } = req.params;
            const { email } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            const validation = await this.sender.validateToken(token);

            // If no email specified, use current user
            const userEmail = email || validation.sub || validation.username;

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get user groups
            const userGroupManager = new UserGroupManager(aiToken);
            const groups = await userGroupManager.getUserGroups(userEmail);

            res.json({
                error: false,
                data: {
                    user: userEmail,
                    groups: groups.map(group => ({
                        name: group.name,
                        description: group.description,
                        system_group: group.system_group
                    }))
                }
            });

        } catch (error) {
            console.error('Get user groups error:', error);

            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get user groups'
                });
            }
        }
    }

    /**
     * Set user role endpoint (add to admin or default group)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async setUserRole(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const { email, role } = req.body;

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            if (!email || !role) {
                throw new ValidationError('Email and role are required');
            }

            if (!['admin', 'default'].includes(role)) {
                throw new ValidationError('Role must be admin or default');
            }

            // Validate admin permissions
            await this.validateAdminPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            const userGroupManager = new UserGroupManager(aiToken);

            // Remove from current role groups
            await userGroupManager.removeMemberFromGroup('admin', email);
            await userGroupManager.removeMemberFromGroup('default', email);

            // Add to new role group
            const success = await userGroupManager.addMemberToGroup(role, email);

            if (!success) {
                throw new Error('Failed to set user role');
            }

            res.json({
                error: false,
                message: `User role set to ${role} successfully`
            });

        } catch (error) {
            console.error('Set user role error:', error);

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
                    message: 'Failed to set user role'
                });
            }
        }
    }
}

module.exports = PermissionController;