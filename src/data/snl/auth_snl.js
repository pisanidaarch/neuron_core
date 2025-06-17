// src/data/snl/auth_snl.js

/**
 * Auth SNL - Authentication commands
 * NOTE: These are NOT SNL commands - they use separate auth endpoints
 */
class AuthSNL {
    constructor() {
        // Auth endpoints - NOT SNL endpoints
        this.endpoints = {
            login: '/auth/login',
            validate: '/auth/validate',
            changePassword: '/auth/changepwd'
        };
    }

    /**
     * Get login endpoint
     */
    getLoginEndpoint() {
        return this.endpoints.login;
    }

    /**
     * Get validate endpoint
     */
    getValidateEndpoint() {
        return this.endpoints.validate;
    }

    /**
     * Get change password endpoint
     */
    getChangePasswordEndpoint() {
        return this.endpoints.changePassword;
    }

    /**
     * Format login payload (NOT SNL)
     */
    formatLoginPayload(username, password) {
        return {
            username,
            password
        };
    }

    /**
     * Format validate payload (NOT SNL)
     */
    formatValidatePayload(token) {
        // Validate is usually done via Authorization header
        // This method is for documentation purposes
        return {
            token
        };
    }

    /**
     * Format change password payload (NOT SNL)
     */
    formatChangePasswordPayload(newPassword) {
        return {
            newPassword
        };
    }

    /**
     * Parse login response
     */
    parseLoginResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid login response');
        }

        if (!response.token) {
            throw new Error('No token in login response');
        }

        return {
            token: response.token,
            user: response.user || null
        };
    }

    /**
     * Parse validate response
     */
    parseValidateResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid validate response');
        }

        return {
            valid: response.valid || false,
            user: response.user || null,
            expires: response.expires || null
        };
    }

    /**
     * Validate password requirements
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Password must be a string');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Add more password requirements as needed
        return true;
    }

    /**
     * Validate username format (email)
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            throw new Error('Username must be a string');
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username)) {
            throw new Error('Username must be a valid email address');
        }

        return true;
    }
}

module.exports = AuthSNL;