// src/core/support/snl_service.js

const SNLManager = require('../../data/manager/snl_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const SNLRequest = require('../../cross/entity/snl_request');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * SNL Service - Business logic for SNL operations
 */
class SNLService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new SNLManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Execute SNL command
     */
    async executeSNL(command, userPermissions, userEmail, token) {
        try {
            // Validate SNL command
            const errors = this.manager.validateSNLCommand(command);
            if (errors.length > 0) {
                throw new ValidationError(`SNL validation failed: ${errors.join(', ')}`);
            }

            // Parse command to check permissions
            const operation = this.manager.parseSNLOperation(command);
            const path = this.manager.parseSNLPath(command);

            // Check permissions
            await this._validateSNLPermissions(operation, path, userPermissions, userEmail);

            // Create SNL request
            const snlRequest = new SNLRequest({
                command,
                aiName: this.aiName,
                userEmail,
                token
            });

            // Execute SNL
            const result = await this.manager.executeSNL(snlRequest, token);

            return {
                operation,
                path,
                result: result.toJSON()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate SNL permissions
     */
    async _validateSNLPermissions(operation, path, userPermissions, userEmail) {
        // If no database specified, allow (global operations)
        if (!path.database) {
            return;
        }

        // Check if user data access
        const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
        if (path.database === 'user-data' && path.namespace === userDataNamespace) {
            return; // User can access their own data
        }

        // Check permissions for other databases
        const permission = userPermissions.find(p => p.database === path.database);
        if (!permission) {
            throw new AuthorizationError(`No permissions for database: ${path.database}`);
        }

        const requiredLevel = this.manager.getRequiredPermissionLevel(operation);
        if (permission.level < requiredLevel) {
            throw new AuthorizationError(`Insufficient permissions for operation: ${operation}`);
        }
    }
}

module.exports = SNLService;