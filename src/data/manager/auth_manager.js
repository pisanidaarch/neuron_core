// src/data/manager/auth_manager.js

const BaseManager = require('./base_manager');
const AuthSNL = require('../snl/auth_snl');
const User = require('../../cross/entity/user');
const { AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Auth Manager - Manages authentication operations
 * Uses auth endpoints, NOT SNL commands
 */
class AuthManager extends BaseManager {
    constructor() {
        super();
        this.snl = new AuthSNL(); // Not really SNL, but auth helpers
    }

    /**
     * Login user
     * @param {string} username - User email
     * @param {string} password - User password
     * @returns {Object} Login response with token
     */
    async login(username, password) {
        this.validateInitialized();

        try {
            // Validate inputs
            this.snl.validateUsername(username);
            this.snl.validatePassword(password);

            // Get login endpoint and payload
            const endpoint = this.snl.getLoginEndpoint();
            const payload = this.snl.formatLoginPayload(username, password);

            // Execute auth request
            const response = await this.executeAuth(endpoint, payload);

            // Parse response
            const loginData = this.snl.parseLoginResponse(response);

            // Log operation
            this.logOperation('login', { username });

            return loginData;

        } catch (error) {
            if (error.message.includes('401')) {
                throw new AuthenticationError('Invalid username or password');
            }
            throw this.handleError(error);
        }
    }

    /**
     * Validate token
     * @param {string} token - JWT token
     * @returns {Object} Validation response
     */
    async validateToken(token) {
        this.validateInitialized();

        try {
            if (!token) {
                throw new ValidationError('Token is required');
            }

            // Use sender's validateToken method directly
            const response = await this.sender.validateToken(token);

            // Parse response
            const validationData = this.snl.parseValidateResponse(response);

            return validationData;

        } catch (error) {
            if (error.message.includes('401')) {
                throw new AuthenticationError('Invalid or expired token');
            }
            throw this.handleError(error);
        }
    }

    /**
     * Change password
     * @param {string} newPassword - New password
     * @param {string} token - User's auth token
     * @returns {Object} Change password response
     */
    async changePassword(newPassword, token) {
        this.validateInitialized();

        try {
            // Validate new password
            this.snl.validatePassword(newPassword);

            if (!token) {
                throw new AuthenticationError('Authentication required');
            }

            // Get endpoint and payload
            const endpoint = this.snl.getChangePasswordEndpoint();
            const payload = this.snl.formatChangePasswordPayload(newPassword);

            // Execute auth request
            const response = await this.executeAuth(endpoint, payload, token);

            // Log operation
            this.logOperation('changePassword', { success: true });

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get current user from token
     * @param {string} token - JWT token
     * @returns {User} User entity
     */
    async getCurrentUser(token) {
        this.validateInitialized();

        try {
            // Validate token and get user info
            const validationData = await this.validateToken(token);

            if (!validationData.valid || !validationData.user) {
                throw new AuthenticationError('Invalid token or user not found');
            }

            // Transform to User entity
            return new User({
                email: validationData.user.email,
                nick: validationData.user.nick,
                group: validationData.user.group,
                active: validationData.user.active,
                permissions: validationData.user.permissions || []
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Refresh token
     * @param {string} token - Current JWT token
     * @returns {Object} New token
     */
    async refreshToken(token) {
        this.validateInitialized();

        try {
            // For now, just validate the token
            // In a real implementation, this would issue a new token
            const validationData = await this.validateToken(token);

            if (!validationData.valid) {
                throw new AuthenticationError('Cannot refresh invalid token');
            }

            // Return the same token (placeholder)
            // Real implementation would generate a new token
            return {
                token: token,
                expires: validationData.expires,
                message: 'Token refresh not implemented - using existing token'
            };

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Logout user (client-side operation)
     * @param {string} token - JWT token
     * @returns {Object} Logout confirmation
     */
    async logout(token) {
        // Logout is typically handled client-side by removing the token
        // This method is here for completeness and logging

        this.logOperation('logout', { token: token?.substring(0, 10) + '...' });

        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    /**
     * Check if user has permission
     * @param {string} token - JWT token
     * @param {string} permission - Permission to check
     * @returns {boolean} Has permission
     */
    async hasPermission(token, permission) {
        try {
            const user = await this.getCurrentUser(token);
            return user.hasPermission(permission);
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if user is admin
     * @param {string} token - JWT token
     * @returns {boolean} Is admin
     */
    async isAdmin(token) {
        try {
            const user = await this.getCurrentUser(token);
            return user.isAdmin();
        } catch (error) {
            return false;
        }
    }
}

module.exports = AuthManager;