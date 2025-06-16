// src/core/support/database_service.js

const DatabaseManager = require('../../data/manager/database_manager');
const NeuronDBSender = require('../../data/neuron_db/sender');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Database Service - Business logic for database operations
 */
class DatabaseService {
    constructor() {
        this.manager = new DatabaseManager();
        this.sender = new NeuronDBSender();
        this.manager.initialize(this.sender);
    }

    /**
     * Create database
     */
    async createDatabase(name, userPermissions, userEmail, token) {
        try {
            // Validate user has main admin permissions
            if (!this.manager.hasMainAdminPermission(userPermissions)) {
                throw new AuthorizationError('Main admin permissions required to create database');
            }

            const result = await this.manager.createDatabase(name, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List databases
     */
    async listDatabases(userPermissions, token) {
        try {
            const databases = await this.manager.listDatabases(token);

            // Filter databases based on user permissions
            const accessibleDatabases = databases.filter(db => {
                const hasPermission = userPermissions.some(p => p.database === db.name);
                return hasPermission || db.name === 'user-data'; // Always include user-data
            });

            return {
                databases: accessibleDatabases,
                count: accessibleDatabases.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(name, userPermissions, userEmail, token) {
        try {
            // Validate user has main admin permissions
            if (!this.manager.hasMainAdminPermission(userPermissions)) {
                throw new AuthorizationError('Main admin permissions required to drop database');
            }

            // Prevent dropping critical databases
            const protectedDatabases = ['main', 'config', 'timeline', 'user-data'];
            if (protectedDatabases.includes(name)) {
                throw new ValidationError(`Cannot drop protected database: ${name}`);
            }

            const result = await this.manager.dropDatabase(name, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(database, namespace, userPermissions, userEmail, token) {
        try {
            // Validate user has admin permissions on the database
            if (!this.manager.hasAdminPermission(database, userPermissions)) {
                throw new AuthorizationError(`Admin permissions required on database ${database} to create namespace`);
            }

            const result = await this.manager.createNamespace(database, namespace, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(database, userPermissions, token) {
        try {
            // Check user has access to database
            const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
            if (!hasPermission) {
                throw new AuthorizationError(`Insufficient permissions to list namespaces in ${database}`);
            }

            const namespaces = await this.manager.listNamespaces(database, token);

            return {
                database,
                namespaces,
                count: namespaces.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(database, namespace, userPermissions, userEmail, token) {
        try {
            // Validate user has admin permissions on the database
            if (!this.manager.hasAdminPermission(database, userPermissions)) {
                throw new AuthorizationError(`Admin permissions required on database ${database} to drop namespace`);
            }

            // Prevent dropping user data namespaces
            if (database === 'user-data' && namespace.includes('_at_')) {
                throw new ValidationError('Cannot drop user data namespaces');
            }

            const result = await this.manager.dropNamespace(database, namespace, token);

            return result;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = DatabaseService;