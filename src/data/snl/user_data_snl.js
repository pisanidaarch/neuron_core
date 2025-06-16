// src/data/snl/user_data_snl.js

/**
 * User Data SNL - SNL operations for user data management
 */
class UserDataSNL {
    constructor() {
        // User data operations
    }

    /**
     * Format email for namespace
     */
    formatEmailForNamespace(email) {
        return email.replace(/\./g, '_').replace('@', '_at_');
    }

    /**
     * Store pointer SNL
     */
    storePointerSNL(userEmail, name, content) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `set(pointer)\nvalues("${content}")\non(user-data.${namespace}.${name})`;
    }

    /**
     * Store structure SNL
     */
    storeStructureSNL(userEmail, name, data) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `set(structure)\nvalues("${name}", ${JSON.stringify(data)})\non(user-data.${namespace}.${name})`;
    }

    /**
     * Store enum SNL
     */
    storeEnumSNL(userEmail, name, values) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const valuesStr = values.map(v => `"${v}"`).join(', ');
        return `set(enum)\nvalues(${valuesStr})\non(user-data.${namespace}.${name})`;
    }

    /**
     * Get user data SNL
     */
    getUserDataSNL(userEmail, dataType, name) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `view(${dataType})\non(user-data.${namespace}.${name})`;
    }

    /**
     * List user data SNL
     */
    listUserDataSNL(userEmail, dataType = null, pattern = '*') {
        const namespace = this.formatEmailForNamespace(userEmail);
        if (dataType) {
            return `list(${dataType})\nvalues("${pattern}")\non(user-data.${namespace})`;
        }
        return `list(structure)\nvalues("${pattern}")\non(user-data.${namespace})`;
    }

    /**
     * Delete user data SNL
     */
    deleteUserDataSNL(userEmail, dataType, name) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `drop(${dataType})\non(user-data.${namespace}.${name})`;
    }

    /**
     * Check user data namespace exists SNL
     */
    checkUserDataNamespaceSNL(userEmail) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `list(namespace)\nvalues("${namespace}")\non(user-data)`;
    }

    /**
     * Parse user data list response
     */
    parseUserDataList(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response;
    }

    /**
     * Parse user data response
     */
    parseUserData(response) {
        if (!response) {
            return null;
        }

        return response;
    }

    /**
     * Validate user data name
     */
    validateUserDataName(name) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('User data name is required');
        }

        // Data names should follow naming conventions
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
            throw new Error('Data name must start with a letter and contain only letters, numbers, dashes, and underscores');
        }

        return true;
    }
}

module.exports = UserDataSNL;