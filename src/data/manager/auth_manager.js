// src/data/manager/auth_manager.js

const AuthSNL = require('../snl/auth_snl');
const UserGroupSNL = require('../snl/user_group_snl');
const { NeuronDBError, AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Auth Manager - Manages authentication operations
 */
class AuthManager {
    constructor() {
        this.authSNL = new AuthSNL();
        this.groupSNL = new UserGroupSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     * @param {Object} aiSender - AI sender instance
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Authenticate user
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {Promise<Object>} Authentication result with token
     */
    async login(username, password) {
        try {
            if (!username || !password) {
                throw new ValidationError('Username and password are required');
            }

            // Use sender's login method directly (NeuronDB handles authentication)
            const loginResult = await this.sender.login(username, password);

            if (!loginResult || !loginResult.token) {
                throw new AuthenticationError('Invalid credentials');
            }

            // Get user information after successful login
            const userInfo = await this.sender.validateToken(loginResult.token);

            return {
                success: true,
                token: loginResult.token,
                user: userInfo,
                expiresIn: '24h'
            };

        } catch (error) {
            console.error('Login error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`Login failed: ${error.message}`);
        }
    }

    /**
     * Validate JWT token
     * @param {string} token - JWT token
     * @returns {Promise<Object>} User information
     */
    async validateToken(token) {
        try {
            if (!token) {
                throw new ValidationError('Token is required');
            }

            // Use sender's validate method
            const userInfo = await this.sender.validateToken(token);

            if (!userInfo) {
                throw new AuthenticationError('Invalid or expired token');
            }

            // Enrich user info with group data
            const enrichedUserInfo = await this.enrichUserWithGroups(userInfo);

            return enrichedUserInfo;

        } catch (error) {
            console.error('Token validation error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`Token validation failed: ${error.message}`);
        }
    }

    /**
     * Change user password
     * @param {string} token - Current user token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Success result
     */
    async changePassword(token, newPassword) {
        try {
            if (!token || !newPassword) {
                throw new ValidationError('Token and new password are required');
            }

            if (newPassword.length < 6) {
                throw new ValidationError('Password must be at least 6 characters long');
            }

            // Use sender's change password method
            const result = await this.sender.changePassword(token, newPassword);

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            console.error('Change password error:', error);

            if (error instanceof ValidationError) {
                throw error;
            }

            throw new NeuronDBError(`Password change failed: ${error.message}`);
        }
    }

    /**
     * Create new user
     * @param {string} adminToken - Admin token
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user data
     */
    async createUser(adminToken, userData) {
        try {
            // Validate admin permissions first
            const adminInfo = await this.validateToken(adminToken);

            if (!this.hasAdminPermissions(adminInfo)) {
                throw new AuthenticationError('Admin permissions required');
            }

            // Validate user data
            const validationErrors = this.authSNL.validateUserData(userData);
            if (validationErrors.length > 0) {
                throw new ValidationError(`User data validation failed: ${validationErrors.join(', ')}`);
            }

            // Check if user already exists
            const existingUser = await this.getUser(userData.email);
            if (existingUser) {
                throw new ValidationError('User already exists');
            }

            // Use sender's create user method
            const result = await this.sender.createUser(adminToken, userData);

            // Add user to default group
            await this.addUserToGroup(adminToken, userData.email, 'default');

            return {
                success: true,
                user: {
                    email: userData.email,
                    nick: userData.nick,
                    created_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Create user error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`User creation failed: ${error.message}`);
        }
    }

    /**
     * Get user information
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User data or null if not found
     */
    async getUser(email) {
        try {
            const getUserSNL = this.authSNL.generateGetUserSNL(email);
            const response = await this.sender.executeSNL(getUserSNL);

            return this.authSNL.parseUserData(response);

        } catch (error) {
            // User not found is not an error
            if (error.message && error.message.includes('not found')) {
                return null;
            }

            console.error('Get user error:', error);
            throw new NeuronDBError(`Failed to get user: ${error.message}`);
        }
    }

    /**
     * Update user information
     * @param {string} token - User or admin token
     * @param {string} email - User email to update
     * @param {Object} updates - Data to update
     * @returns {Promise<Object>} Updated user data
     */
    async updateUser(token, email, updates) {
        try {
            const userInfo = await this.validateToken(token);

            // Check if user can update this profile
            const canUpdate = userInfo.email === email || this.hasAdminPermissions(userInfo);

            if (!canUpdate) {
                throw new AuthenticationError('Permission denied');
            }

            const updateSNL = this.authSNL.generateUpdateUserSNL(email, updates);
            await this.sender.executeSNL(updateSNL);

            return {
                success: true,
                message: 'User updated successfully'
            };

        } catch (error) {
            console.error('Update user error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`User update failed: ${error.message}`);
        }
    }

    /**
     * Add user to group
     * @param {string} adminToken - Admin token
     * @param {string} userEmail - User email
     * @param {string} groupName - Group name
     * @returns {Promise<Object>} Success result
     */
    async addUserToGroup(adminToken, userEmail, groupName) {
        try {
            // For default group, allow without admin check (during user creation)
            if (groupName !== 'default') {
                const adminInfo = await this.validateToken(adminToken);
                if (!this.hasAdminPermissions(adminInfo)) {
                    throw new AuthenticationError('Admin permissions required');
                }
            }

            // Get current group data
            const getGroupSNL = this.groupSNL.generateGetGroupSNL(groupName);
            const groupResponse = await this.sender.executeSNL(getGroupSNL);
            const groupData = this.groupSNL.parseGroupData(groupResponse);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            // Add user if not already member
            if (!groupData.members.includes(userEmail)) {
                groupData.members.push(userEmail);

                const updateSNL = this.groupSNL.generateUpdateGroupMembersSNL(groupName, groupData.members);
                await this.sender.executeSNL(updateSNL);
            }

            return {
                success: true,
                message: `User added to group '${groupName}'`
            };

        } catch (error) {
            console.error('Add user to group error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to add user to group: ${error.message}`);
        }
    }

    /**
     * Remove user from group
     * @param {string} adminToken - Admin token
     * @param {string} userEmail - User email
     * @param {string} groupName - Group name
     * @returns {Promise<Object>} Success result
     */
    async removeUserFromGroup(adminToken, userEmail, groupName) {
        try {
            const adminInfo = await this.validateToken(adminToken);
            if (!this.hasAdminPermissions(adminInfo)) {
                throw new AuthenticationError('Admin permissions required');
            }

            // Get current group data
            const getGroupSNL = this.groupSNL.generateGetGroupSNL(groupName);
            const groupResponse = await this.sender.executeSNL(getGroupSNL);
            const groupData = this.groupSNL.parseGroupData(groupResponse);

            if (!groupData) {
                throw new ValidationError(`Group '${groupName}' not found`);
            }

            // Remove user if member
            const memberIndex = groupData.members.indexOf(userEmail);
            if (memberIndex > -1) {
                groupData.members.splice(memberIndex, 1);

                const updateSNL = this.groupSNL.generateUpdateGroupMembersSNL(groupName, groupData.members);
                await this.sender.executeSNL(updateSNL);
            }

            return {
                success: true,
                message: `User removed from group '${groupName}'`
            };

        } catch (error) {
            console.error('Remove user from group error:', error);

            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }

            throw new NeuronDBError(`Failed to remove user from group: ${error.message}`);
        }
    }

    /**
     * Enrich user info with group data
     * @param {Object} userInfo - Base user info
     * @returns {Promise<Object>} Enriched user info
     */
    async enrichUserWithGroups(userInfo) {
        try {
            const getUserGroupsSNL = this.groupSNL.generateGetUserGroupsSNL(userInfo.email);
            const groupsResponse = await this.sender.executeSNL(getUserGroupsSNL);
            const groups = this.groupSNL.parseGroupsList(groupsResponse);

            return {
                ...userInfo,
                groups: groups.map(g => g.name),
                groupDetails: groups,
                isAdmin: groups.some(g => g.name === 'admin'),
                isSubscriptionAdmin: groups.some(g => g.name === 'subscription_admin')
            };

        } catch (error) {
            // If we can't get groups, return user info without groups
            console.warn('Failed to enrich user with groups:', error);
            return {
                ...userInfo,
                groups: [],
                groupDetails: [],
                isAdmin: false,
                isSubscriptionAdmin: false
            };
        }
    }

    /**
     * Check if user has admin permissions
     * @param {Object} userInfo - User information
     * @returns {boolean} True if user has admin permissions
     */
    hasAdminPermissions(userInfo) {
        return userInfo.groups?.includes('admin') ||
               userInfo.groups?.includes('subscription_admin') ||
               userInfo.isAdmin ||
               userInfo.isSubscriptionAdmin;
    }

    /**
     * Generate random password
     * @param {number} length - Password length
     * @returns {string} Random password
     */
    generateRandomPassword(length = 12) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

module.exports = AuthManager;