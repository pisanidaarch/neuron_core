// src/api/security/controllers/permission_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const UserGroupManager = require('../../../data/manager/user_group_manager');
const UserManager = require('../../../data/manager/user_manager');
const NeuronDBSender = require('../../../data/neuron_db/sender');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../../cross/entity/errors');

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
        ) || validation.groups?.includes('admin');

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
                data: {
                    groups: groups.map(group => ({
                        name: group.name,
                        description: group.description,
                        permissions: group.permissions,
                        isSystem: group.isSystem,
                        createdAt: group.createdAt
                    })),
                    total: groups.length
                }
            });

        } catch (error) {
            console.error('List groups error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
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
     * Validate permissions endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async validatePermissions(req, res) {
        try {
            const { aiName } = req.params;
            const { permission, resource } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token and get user info
            const userInfo = await this.sender.validateToken(token);

            // Check specific permission
            let hasPermission = false;
            let permissionDetails = null;

            if (permission) {
                // Check if user has the specific permission
                hasPermission = this.checkUserPermission(userInfo, permission, resource);
                permissionDetails = this.getPermissionDetails(userInfo, permission, resource);
            }

            res.json({
                error: false,
                data: {
                    user: userInfo.username,
                    permission: permission,
                    resource: resource,
                    hasPermission: hasPermission,
                    permissionDetails: permissionDetails,
                    userGroups: userInfo.groups || [],
                    userPermissions: userInfo.permissions || [],
                    validatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Validate permissions error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to validate permissions'
                });
            }
        }
    }

    /**
     * Get user permissions endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getUserPermissions(req, res) {
        try {
            const { aiName, username } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            const currentUser = await this.sender.validateToken(token);

            // Users can only see their own permissions unless they're admin
            if (currentUser.username !== username) {
                await this.validateAdminPermissions(token);
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get user groups for permission details
            const userGroupManager = new UserGroupManager(aiToken);
            const groups = await userGroupManager.listGroups(true); // Include hidden groups for admin

            // Build comprehensive permissions
            const userPermissions = this.buildUserPermissions(currentUser, groups);

            res.json({
                error: false,
                data: {
                    username: username,
                    permissions: userPermissions,
                    groups: currentUser.groups || [],
                    directPermissions: currentUser.permissions || [],
                    effectivePermissions: this.calculateEffectivePermissions(currentUser, groups),
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get user permissions error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get user permissions'
                });
            }
        }
    }

    /**
     * Check if user has specific permission
     * @param {Object} userInfo - User information
     * @param {string} permission - Permission to check
     * @param {string} resource - Resource to check permission on
     * @returns {boolean}
     */
    checkUserPermission(userInfo, permission, resource) {
        // Check if user is admin (has all permissions)
        if (userInfo.groups?.includes('admin')) {
            return true;
        }

        // Check direct permissions
        if (userInfo.permissions) {
            const hasDirectPermission = userInfo.permissions.some(p => {
                if (p.permission === permission || p.permission === '*') {
                    if (!resource) return true;
                    return p.resource === resource || p.resource === '*';
                }
                return false;
            });

            if (hasDirectPermission) return true;
        }

        // Check group permissions (this would require loading group details)
        // For now, we'll just check basic group-based permissions
        const permissionMap = {
            'subscription_admin': ['subscription.*'],
            'admin': ['*'],
            'default': ['ai.use', 'user.profile.edit']
        };

        if (userInfo.groups) {
            for (const group of userInfo.groups) {
                const groupPermissions = permissionMap[group] || [];
                const hasGroupPermission = groupPermissions.some(p => {
                    if (p === '*') return true;
                    if (p.endsWith('*')) {
                        return permission.startsWith(p.slice(0, -1));
                    }
                    return p === permission;
                });

                if (hasGroupPermission) return true;
            }
        }

        return false;
    }

    /**
     * Get permission details
     * @param {Object} userInfo - User information
     * @param {string} permission - Permission to check
     * @param {string} resource - Resource to check
     * @returns {Object}
     */
    getPermissionDetails(userInfo, permission, resource) {
        const details = {
            source: 'none',
            level: 0,
            scope: 'none',
            granted: false
        };

        // Check admin status
        if (userInfo.groups?.includes('admin')) {
            details.source = 'admin_group';
            details.level = 5;
            details.scope = 'global';
            details.granted = true;
            return details;
        }

        // Check direct permissions
        if (userInfo.permissions) {
            const directPermission = userInfo.permissions.find(p => {
                if (p.permission === permission || p.permission === '*') {
                    if (!resource) return true;
                    return p.resource === resource || p.resource === '*';
                }
                return false;
            });

            if (directPermission) {
                details.source = 'direct_permission';
                details.level = directPermission.level || 1;
                details.scope = directPermission.resource || 'specific';
                details.granted = true;
                return details;
            }
        }

        // Check group permissions
        if (userInfo.groups) {
            for (const group of userInfo.groups) {
                if (this.groupHasPermission(group, permission)) {
                    details.source = `group_${group}`;
                    details.level = this.getGroupPermissionLevel(group);
                    details.scope = this.getGroupPermissionScope(group);
                    details.granted = true;
                    return details;
                }
            }
        }

        return details;
    }

    /**
     * Check if group has permission
     * @param {string} group - Group name
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    groupHasPermission(group, permission) {
        const permissionMap = {
            'subscription_admin': ['subscription.create', 'subscription.cancel', 'subscription.change_plan'],
            'admin': ['*'],
            'default': ['ai.use', 'user.profile.edit']
        };

        const groupPermissions = permissionMap[group] || [];
        return groupPermissions.some(p => {
            if (p === '*') return true;
            if (p.endsWith('*')) {
                return permission.startsWith(p.slice(0, -1));
            }
            return p === permission;
        });
    }

    /**
     * Get group permission level
     * @param {string} group - Group name
     * @returns {number}
     */
    getGroupPermissionLevel(group) {
        const levelMap = {
            'subscription_admin': 4,
            'admin': 5,
            'default': 1
        };

        return levelMap[group] || 0;
    }

    /**
     * Get group permission scope
     * @param {string} group - Group name
     * @returns {string}
     */
    getGroupPermissionScope(group) {
        const scopeMap = {
            'subscription_admin': 'subscription',
            'admin': 'global',
            'default': 'user'
        };

        return scopeMap[group] || 'none';
    }

    /**
     * Build comprehensive user permissions
     * @param {Object} userInfo - User information
     * @param {Array} groups - Available groups
     * @returns {Object}
     */
    buildUserPermissions(userInfo, groups) {
        const permissions = {
            direct: userInfo.permissions || [],
            fromGroups: [],
            effective: [],
            summary: {
                isAdmin: userInfo.groups?.includes('admin') || false,
                canManageUsers: false,
                canManageSubscriptions: false,
                canConfigureAI: false,
                canExecuteCommands: true
            }
        };

        // Add permissions from groups
        if (userInfo.groups) {
            for (const groupName of userInfo.groups) {
                const group = groups.find(g => g.name === groupName);
                if (group) {
                    permissions.fromGroups.push({
                        group: groupName,
                        permissions: group.permissions
                    });
                }
            }
        }

        // Calculate effective permissions
        permissions.effective = this.calculateEffectivePermissions(userInfo, groups);

        // Update summary
        permissions.summary.canManageUsers = this.checkUserPermission(userInfo, 'user.create');
        permissions.summary.canManageSubscriptions = this.checkUserPermission(userInfo, 'subscription.manage');
        permissions.summary.canConfigureAI = this.checkUserPermission(userInfo, 'ai.configure');

        return permissions;
    }

    /**
     * Calculate effective permissions
     * @param {Object} userInfo - User information
     * @param {Array} groups - Available groups
     * @returns {Array}
     */
    calculateEffectivePermissions(userInfo, groups) {
        const effectivePermissions = new Set();

        // Add direct permissions
        if (userInfo.permissions) {
            userInfo.permissions.forEach(p => {
                effectivePermissions.add(p.permission || p);
            });
        }

        // Add group permissions
        if (userInfo.groups) {
            userInfo.groups.forEach(groupName => {
                const group = groups.find(g => g.name === groupName);
                if (group && group.permissions) {
                    group.permissions.forEach(permission => {
                        effectivePermissions.add(permission);
                    });
                }
            });
        }

        return Array.from(effectivePermissions);
    }
}

module.exports = PermissionController;