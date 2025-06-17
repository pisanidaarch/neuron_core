// src/data/snl/auth_snl.js

/**
 * Auth SNL - Authentication related SNL commands
 */
class AuthSNL {
    constructor() {
        this.entityName = 'user';
    }

    /**
     * Generate login SNL command
     * @param {string} username - Username or email
     * @param {string} password - User password
     * @returns {string} SNL command
     */
    generateLoginSNL(username, password) {
        return `login("${username}", "${password}")`;
    }

    /**
     * Generate validate token SNL command
     * @param {string} token - JWT token to validate
     * @returns {string} SNL command
     */
    generateValidateSNL(token) {
        return `validate("${token}")`;
    }

    /**
     * Generate change password SNL command
     * @param {string} newPassword - New password
     * @returns {string} SNL command
     */
    generateChangePasswordSNL(newPassword) {
        return `changepwd("${newPassword}")`;
    }

    /**
     * Generate create user SNL command
     * @param {Object} userData - User data
     * @returns {string} SNL command
     */
    generateCreateUserSNL(userData) {
        const { email, password, nick, permissions = {} } = userData;

        const userObject = {
            email,
            password,
            nick,
            permissions,
            created_at: new Date().toISOString(),
            active: true
        };

        return `set(structure)\nvalues("${this.entityName}", ${JSON.stringify(userObject)})\non(main.core.${email.replace('@', '_').replace('.', '_')})`;
    }

    /**
     * Generate get user SNL command
     * @param {string} email - User email
     * @returns {string} SNL command
     */
    generateGetUserSNL(email) {
        const namespace = email.replace('@', '_').replace('.', '_');
        return `view(structure)\nvalues("${this.entityName}")\non(main.core.${namespace})`;
    }

    /**
     * Generate update user SNL command
     * @param {string} email - User email
     * @param {Object} updates - Data to update
     * @returns {string} SNL command
     */
    generateUpdateUserSNL(email, updates) {
        const namespace = email.replace('@', '_').replace('.', '_');
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        return `set(structure)\nvalues("${this.entityName}", ${JSON.stringify(updateData)})\non(main.core.${namespace})`;
    }

    /**
     * Generate delete user SNL command
     * @param {string} email - User email
     * @returns {string} SNL command
     */
    generateDeleteUserSNL(email) {
        const namespace = email.replace('@', '_').replace('.', '_');
        return `remove(structure)\nvalues("${this.entityName}")\non(main.core.${namespace})`;
    }

    /**
     * Generate list users SNL command
     * @returns {string} SNL command
     */
    generateListUsersSNL() {
        return `list(structure)\nvalues("${this.entityName}")\non(main.core)`;
    }

    /**
     * Parse user data from SNL response
     * @param {Object} response - SNL response
     * @returns {Object|null} User data
     */
    parseUserData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Look for user data in the response
        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                if (value.email) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * Validate user data
     * @param {Object} userData - User data to validate
     * @returns {Array} Array of validation errors
     */
    validateUserData(userData) {
        const errors = [];

        if (!userData.email || typeof userData.email !== 'string') {
            errors.push('Email is required and must be a string');
        } else if (!this.isValidEmail(userData.email)) {
            errors.push('Email format is invalid');
        }

        if (!userData.password || typeof userData.password !== 'string') {
            errors.push('Password is required and must be a string');
        } else if (userData.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        if (!userData.nick || typeof userData.nick !== 'string') {
            errors.push('Nick is required and must be a string');
        }

        return errors;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate namespace from email
     * @param {string} email - User email
     * @returns {string} Namespace
     */
    generateNamespaceFromEmail(email) {
        return email.replace('@', '_').replace(/\./g, '_').toLowerCase();
    }
}

module.exports = AuthSNL;