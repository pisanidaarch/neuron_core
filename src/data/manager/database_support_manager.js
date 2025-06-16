// src/data/manager/database_support_manager.js

const DatabaseSNL = require('../snl/database_snl');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * DatabaseSupportManager - Manages database operations for support
 */
class DatabaseSupportManager {
    constructor() {
        this.snl = new DatabaseSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with sender
     * @param {Object} sender - Sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * List databases
     * @param {string} token - Token
     * @returns {Promise<Array>}
     */
    async listDatabases(token) {
        try {
            const command = this.snl.listDatabasesSNL();
            const response = await this.sender.executeSNL(command, token);

            return this.snl.parseDatabaseListResponse(response);
        } catch (error) {
            throw new NeuronDBError(`Failed to list databases: ${error.message}`);
        }
    }

    /**
     * Create database
     * @param {string} databaseName - Database name
     * @param {string} token - Token
     * @returns {Promise<boolean>}
     */
    async createDatabase(databaseName, token) {
        try {
            const command = this.snl.createDatabaseSNL(databaseName);
            await this.sender.executeSNL(command, token);
            return true;
        } catch (error) {
            throw new NeuronDBError(`Failed to create database: ${error.message}`);
        }
    }

    /**
     * Drop database
     * @param {string} databaseName - Database name
     * @param {string} token - Token
     * @returns {Promise<boolean>}
     */
    async dropDatabase(databaseName, token) {
        try {
            const command = this.snl.dropDatabaseSNL(databaseName);
            await this.sender.executeSNL(command, token);
            return true;
        } catch (error) {
            throw new NeuronDBError(`Failed to drop database: ${error.message}`);
        }
    }

    /**
     * List namespaces
     * @param {string} databaseName - Database name
     * @param {string} token - Token
     * @returns {Promise<Array>}
     */
    async listNamespaces(databaseName, token) {
        try {
            const command = this.snl.listNamespacesSNL(databaseName);
            const response = await this.sender.executeSNL(command, token);

            return this.snl.parseNamespaceListResponse(response);
        } catch (error) {
            throw new NeuronDBError(`Failed to list namespaces: ${error.message}`);
        }
    }

    /**
     * Create namespace
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @param {string} token - Token
     * @returns {Promise<boolean>}
     */
    async createNamespace(databaseName, namespaceName, token) {
        try {
            const command = this.snl.createNamespaceSNL(databaseName, namespaceName);
            await this.sender.executeSNL(command, token);
            return true;
        } catch (error) {
            throw new NeuronDBError(`Failed to create namespace: ${error.message}`);
        }
    }

    /**
     * Drop namespace
     * @param {string} databaseName - Database name
     * @param {string} namespaceName - Namespace name
     * @param {string} token - Token
     * @returns {Promise<boolean>}
     */
    async dropNamespace(databaseName, namespaceName, token) {
        try {
            const command = this.snl.dropNamespaceSNL(databaseName, namespaceName);
            await this.sender.executeSNL(command, token);
            return true;
        } catch (error) {
            throw new NeuronDBError(`Failed to drop namespace: ${error.message}`);
        }
    }

    /**
     * Check if user has admin permission on database
     * @param {string} database - Database name
     * @param {Array} permissions - User permissions
     * @returns {boolean}
     */
    hasAdminPermission(database, permissions) {
        const permission = permissions.find(p => p.database === database);
        return permission && permission.level >= 3; // admin level
    }

    /**
     * Check if user has admin permission on main database
     * @param {Array} permissions - User permissions
     * @returns {boolean}
     */
    hasMainAdminPermission(permissions) {
        return this.hasAdminPermission('main', permissions);
    }
}

module.exports = DatabaseSupportManager;