// src/data/manager/database_manager.js

const DatabaseSNL = require('../snl/database_snl');
const DatabaseInfo = require('../../cross/entity/database_info');
const NamespaceInfo = require('../../cross/entity/namespace_info');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Database Manager - Manages database and namespace operations
 */
class DatabaseManager {
    constructor() {
        this.snl = new DatabaseSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * Create database
     */
    async createDatabase(name, userEmail, token) {
        try {
            this.snl.validateDatabaseName(name);

            const response = await this.sender.createDatabase(token, name);

            return {
                success: true,
                database: name,
                createdBy: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to create database: ${error.message}`);
        }
    }

    /**
     * List databases
     */
    async listDatabases(token) {
        try {
            const response = await this.sender.listDatabases(token);
            const databases = this.snl.parseDatabaseList(response);

            return databases.map(db => new DatabaseInfo({
                name: db,
                description: '',
                createdAt: new Date().toISOString()
            }));

        } catch (error) {
            throw new NeuronDBError(`Failed to list databases: ${error.message}`);
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(name, token) {
        try {
            this.snl.validateDatabaseName(name);

            const response = await this.sender.dropDatabase(token, name);

            return {
                success: true,
                database: name,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to drop database: ${error.message}`);
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(database, namespace, userEmail, token) {
        try {
            this.snl.validateDatabaseName(database);
            this.snl.validateNamespaceName(namespace);

            const response = await this.sender.createNamespace(token, database, namespace);

            return {
                success: true,
                database: database,
                namespace: namespace,
                createdBy: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to create namespace: ${error.message}`);
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(database, token) {
        try {
            this.snl.validateDatabaseName(database);

            const response = await this.sender.listNamespaces(token, database);
            const namespaces = this.snl.parseNamespaceList(response);

            return namespaces.map(ns => new NamespaceInfo({
                name: ns,
                database: database,
                description: '',
                createdAt: new Date().toISOString()
            }));

        } catch (error) {
            throw new NeuronDBError(`Failed to list namespaces: ${error.message}`);
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(database, namespace, token) {
        try {
            this.snl.validateDatabaseName(database);
            this.snl.validateNamespaceName(namespace);

            const response = await this.sender.dropNamespace(token, database, namespace);

            return {
                success: true,
                database: database,
                namespace: namespace,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to drop namespace: ${error.message}`);
        }
    }

    /**
     * Check if user has admin permission on database
     */
    hasAdminPermission(database, permissions) {
        const permission = permissions.find(p => p.database === database);
        return permission && permission.level >= 3; // admin level
    }

    /**
     * Check if user has admin permission on main database
     */
    hasMainAdminPermission(permissions) {
        return this.hasAdminPermission('main', permissions);
    }
}

module.exports = DatabaseManager;

