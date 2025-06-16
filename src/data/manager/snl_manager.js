// src/data/manager/snl_manager.js

const SNLRequest = require('../../cross/entity/snl_request');
const SNLResponse = require('../../cross/entity/snl_response');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * SNL Manager - Manages direct SNL execution
 */
class SNLManager {
    constructor() {
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * Execute SNL command
     */
    async executeSNL(snlRequest, token) {
        try {
            // Validate request
            const errors = snlRequest.validate();
            if (errors.length > 0) {
                throw new Error(`SNL request validation failed: ${errors.join(', ')}`);
            }

            const startTime = Date.now();
            const response = await this.sender.executeSNL(snlRequest.command, token);
            const executionTime = Date.now() - startTime;

            const snlResponse = new SNLResponse();
            snlResponse.setSuccess(response, executionTime);

            return snlResponse;

        } catch (error) {
            const snlResponse = new SNLResponse();
            snlResponse.setError(error.message);
            throw new NeuronDBError(`SNL execution failed: ${error.message}`);
        }
    }

    /**
     * Validate SNL command syntax (basic validation)
     */
    validateSNLCommand(command) {
        const errors = [];

        if (!command || typeof command !== 'string') {
            errors.push('SNL command must be a string');
            return errors;
        }

        const lines = command.trim().split('\n');
        if (lines.length < 2) {
            errors.push('SNL command must have at least operation and on clauses');
            return errors;
        }

        // Check for operation line
        const operationLine = lines.find(line =>
            line.trim().match(/^(set|view|list|remove|drop|search|match|tag|untag|audit)\(/));

        if (!operationLine) {
            errors.push('SNL command must contain a valid operation (set, view, list, remove, drop, search, match, tag, untag, audit)');
        }

        // Check for on clause
        const onLine = lines.find(line => line.trim().startsWith('on('));
        if (!onLine) {
            errors.push('SNL command must contain an "on" clause');
        }

        return errors;
    }

    /**
     * Parse SNL operation type
     */
    parseSNLOperation(command) {
        const operationMatch = command.match(/^(set|view|list|remove|drop|search|match|tag|untag|audit)\(/m);
        return operationMatch ? operationMatch[1] : null;
    }

    /**
     * Parse SNL target path
     */
    parseSNLPath(command) {
        const onMatch = command.match(/on\(([^)]*)\)/);
        if (!onMatch) return null;

        const path = onMatch[1].trim();
        if (!path) return { database: null, namespace: null, entity: null };

        const parts = path.split('.');
        return {
            database: parts[0] || null,
            namespace: parts[1] || null,
            entity: parts[2] || null
        };
    }

    /**
     * Check if operation requires specific permissions
     */
    getRequiredPermissionLevel(operation) {
        const readOperations = ['view', 'list', 'search', 'match'];
        const writeOperations = ['set', 'remove', 'tag', 'untag'];
        const adminOperations = ['drop'];

        if (readOperations.includes(operation)) return 1;
        if (writeOperations.includes(operation)) return 2;
        if (adminOperations.includes(operation)) return 3;

        return 2; // default to write permission
    }
}

module.exports = SNLManager;