// src/data/snl/user_snl.js

/**
 * UserSNL - SNL commands for User entity
 */
class UserSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * Get users list SNL
     * @returns {string}
     */
    getListUsersSNL() {
        return 'list(structure)\nvalues("*")\non(main.core.users)';
    }

    /**
     * Get specific user SNL
     * @param {string} email - User email
     * @returns {string}
     */
    getUserSNL(email) {
        if (!email) {
            throw new Error('User email is required');
        }
        return `one(structure, id)\nvalues("${email}")\non(main.core.users)`;
    }

    /**
     * Create/Update user SNL
     * @param {string} email - User email
     * @param {Object} userData - User data
     * @returns {string}
     */
    setUserSNL(email, userData) {
        if (!email || !userData) {
            throw new Error('User email and data are required');
        }
        const userDataJson = JSON.stringify(userData);
        return `set(structure)\nvalues("${email}", ${userDataJson})\non(main.core.users)`;
    }

    /**
     * Remove user SNL
     * @param {string} email - User email
     * @returns {string}
     */
    removeUserSNL(email) {
        if (!email) {
            throw new Error('User email is required');
        }
        return `remove(structure)\nvalues("${email}")\non(main.core.users)`;
    }

    /**
     * Search users SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchUsersSNL(searchTerm) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        return `search(structure)\nvalues("${searchTerm}")\non(main.core.users)`;
    }

    /**
     * Parse users list response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {Array} Array of user emails
     */
    parseUsersListResponse(response) {
        if (!response) return [];

        if (Array.isArray(response)) {
            return response;
        }

        if (typeof response === 'object') {
            return Object.keys(response);
        }

        return [];
    }

    /**
     * Parse single user response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object|null} User data
     */
    parseUserResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return {
            email: response.email,
            nick: response.nick,
            roles: response.roles || { permissions: {} },
            created_at: response.created_at,
            updated_at: response.updated_at,
            active: response.active !== undefined ? response.active : true
        };
    }

    /**
     * Parse search results
     * @param {Object} response - Response from NeuronDB
     * @returns {Array} Array of matched users
     */
    parseSearchResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const results = [];
        for (const [email, userData] of Object.entries(response)) {
            results.push({
                email,
                ...userData
            });
        }

        return results;
    }

    /**
     * Build user data for NeuronDB
     * @param {Object} user - User entity
     * @returns {Object} User data formatted for NeuronDB
     */
    buildUserData(user) {
        return {
            email: user.email,
            nick: user.nick,
            roles: user.roles,
            created_at: user.created_at,
            updated_at: user.updated_at,
            active: user.active
        };
    }

    /**
     * Create initial users structure if it doesn't exist
     * @returns {string}
     */
    createUsersStructureSNL() {
        return 'set(structure)\nvalues("users", {})\non(main.core.users)';
    }

    /**
     * Get all users with their data
     * @returns {string}
     */
    getAllUsersSNL() {
        return 'view(structure)\non(main.core.users)';
    }

    /**
     * Parse all users response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object} Object with email as key and user data as value
     */
    parseAllUsersResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        return response;
    }

    /**
     * Check if users structure exists
     * @returns {string}
     */
    checkUsersStructureExistsSNL() {
        return 'list(structure)\nvalues("users")\non(main.core)';
    }

    /**
     * Parse structure exists response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {boolean} True if structure exists
     */
    parseStructureExistsResponse(response) {
        if (Array.isArray(response)) {
            return response.includes('users');
        }

        if (typeof response === 'object') {
            return Object.keys(response).includes('users');
        }

        return false;
    }
}

module.exports = UserSNL;