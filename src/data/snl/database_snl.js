// src/data/snl/database_snl.js

/**
 * DatabaseSNL - SNL commands for database management
 */
class DatabaseSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * List databases SNL
     * @returns {string}
     */
    listDatabasesSNL() {
        return 'list(database)\non()';
    }

    /**
     * Create database SNL
     * @param {string} databaseName - Database name
     * @returns {string}
     */
    createDatabaseSNL(databaseName) {
        return `set(database)\nvalues("${databaseName}")\non()`;
    }

    /**
     * Drop database SNL
     * @param {string} databaseName - Database name
     * @returns {string}
     */
    dropDatabaseSNL(databaseName) {
        return `drop(database)\nvalues("${databaseName}")\non()`;
    }

    /**
     * List namespaces SNL
     * @param {string} databaseName - Database name
     * @returns {string}
     */
    listNamespacesSNL(databaseName) {
        return `list(namespace)\non(${databaseName})`;
    }

    /**
     * Create namespace SNL
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @returns {string}
     */
    createNamespaceSNL(databaseName, namespaceName) {
        return `set(namespace)\nvalues("${namespaceName}")\non(${databaseName})`;
    }

    /**
     * Drop namespace SNL
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @returns {string}
     */
    dropNamespaceSNL(databaseName, namespaceName) {
        return `drop(namespace)\nvalues("${namespaceName}")\non(${databaseName})`;
    }

    /**
     * Parse database list response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {Array}
     */
    parseDatabaseListResponse(response) {
        if (!response) return [];

        if (Array.isArray(response)) {
            return response.map(db => ({ name: db }));
        }

        if (typeof response === 'object') {
            return Object.keys(response).map(name => ({ name }));
        }

        return [];
    }

    /**
     * Parse namespace list response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {Array}
     */
    parseNamespaceListResponse(response) {
        if (!response) return [];

        if (Array.isArray(response)) {
            return response.map(ns => ({ name: ns }));
        }

        if (typeof response === 'object') {
            return Object.keys(response).map(name => ({ name }));
        }

        return [];
    }
}

module.exports = DatabaseSNL;