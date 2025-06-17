// src/data/snl/user_snl.js

const BaseSNL = require('./base_snl');

/**
 * User SNL - Generates SNL commands for user operations
 */
class UserSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'main';
        this.namespace = 'core';
        this.entity = 'users';
    }

    /**
     * Get user by email - CORRECTED: using view instead of one
     */
    getUserSNL(email) {
        const path = this.buildPath(this.database, this.namespace, this.entity, email);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Create or update user
     */
    setUserSNL(email, userData) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        const values = [email, userData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * List all users
     */
    listUsersSNL(pattern = '*') {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search users by term
     */
    searchUsersSNL(searchTerm) {
        const path = this.buildPath(this.database, this.namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove user
     */
    removeUserSNL(email) {
        const path = this.buildPath(this.database, this.namespace, this.entity);
        return this.buildSNL('remove', 'structure', email, path);
    }

    /**
     * Parse user from SNL response
     */
    parseUser(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Response format: { "email": { userData } }
        const emails = Object.keys(response);
        if (emails.length === 0) {
            return null;
        }

        const email = emails[0];
        const userData = response[email];

        return {
            email,
            ...userData
        };
    }

    /**
     * Parse multiple users from list response
     */
    parseUserList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([email, userData]) => ({
            email,
            ...userData
        }));
    }

    /**
     * Validate user data structure
     */
    validateUserData(userData) {
        const required = ['nick', 'password', 'group'];
        const missing = required.filter(field => !userData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required user fields: ${missing.join(', ')}`);
        }

        // Validate types
        if (typeof userData.nick !== 'string') {
            throw new Error('User nick must be a string');
        }

        if (typeof userData.password !== 'string' || userData.password.length < 6) {
            throw new Error('User password must be a string with at least 6 characters');
        }

        if (typeof userData.group !== 'string') {
            throw new Error('User group must be a string');
        }

        return true;
    }
}

module.exports = UserSNL;