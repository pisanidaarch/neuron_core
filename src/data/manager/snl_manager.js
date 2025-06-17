// src/data/manager/snl_manager.js

const BaseManager = require('./base_manager');
const BaseSNL = require('../snl/base_snl');
const PermissionSNL = require('../snl/permission_snl');
const { SNLError, AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * SNL Manager - Central manager for SNL command execution
 * Validates permissions and executes SNL commands
 */
class SNLManager extends BaseManager {
    constructor() {
        super();
        this.snl = new BaseSNL();
        this.permissionSNL = new PermissionSNL();
    }

    /**
     * Execute SNL command with permission validation
     * @param {Object} snlRequest - SNL request object
     * @param {string} token - Authentication token
     * @returns {Object} Command result
     */
    async executeSNL(snlRequest, token) {
        this.validateInitialized();

        try {
            const { command } = snlRequest;

            // Validate SNL syntax
            this.snl.validateSNLSyntax(command);

            // Parse command components
            const operation = this.parseSNLOperation(command);
            const path = this.parseSNLPath(command);

            // Log operation
            this.logOperation('executeSNL', {
                operation,
                path,
                user: snlRequest.userEmail
            });

            // Execute command
            const result = await this.executeSNL(command, token);

            return {
                success: true,
                operation,
                path,
                result
            };

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate SNL command
     * @param {string} command - SNL command
     * @returns {string[]} Array of validation errors
     */
    validateSNLCommand(command) {
        const errors = [];

        try {
            this.snl.validateSNLSyntax(command);
        } catch (error) {
            errors.push(error.message);
        }

        // Additional validations
        const lines = command.split('\n').map(l => l.trim()).filter(l => l);

        // Check for required lines
        if (!lines.some(l => l.startsWith('on('))) {
            errors.push('Missing on() clause');
        }

        // Check for invalid commands
        const firstLine = lines[0];
        if (firstLine) {
            const commandMatch = firstLine.match(/^(\w+)\(/);
            if (commandMatch) {
                const cmd = commandMatch[1];
                if (!this.snl.validCommands.includes(cmd)) {
                    errors.push(`Invalid command: ${cmd}`);
                }
            }
        }

        return errors;
    }

    /**
     * Parse SNL operation from command
     * @param {string} command - SNL command
     * @returns {string} Operation name
     */
    parseSNLOperation(command) {
        const lines = command.split('\n');
        const firstLine = lines[0].trim();
        const match = firstLine.match(/^(\w+)\(/);

        if (!match) {
            throw new SNLError('Cannot parse operation from SNL command', command);
        }

        return match[1];
    }

    /**
     * Parse SNL path from command
     * @param {string} command - SNL command
     * @returns {Object} Path components
     */
    parseSNLPath(command) {
        const lines = command.split('\n');
        const onLine = lines.find(l => l.trim().startsWith('on('));

        if (!onLine) {
            return { database: null, namespace: null, entity: null };
        }

        // Extract content between on( and )
        const match = onLine.match(/on\((.*?)\)/);
        if (!match) {
            return { database: null, namespace: null, entity: null };
        }

        const pathStr = match[1].trim();
        if (!pathStr) {
            return { database: null, namespace: null, entity: null };
        }

        const parts = pathStr.split('.');

        return {
            database: parts[0] || null,
            namespace: parts[1] || null,
            entity: parts[2] || null,
            fullPath: pathStr
        };
    }

    /**
     * Parse SNL values from command
     * @param {string} command - SNL command
     * @returns {Array|Object|string|null} Parsed values
     */
    parseSNLValues(command) {
        const lines = command.split('\n');
        const valuesLine = lines.find(l => l.trim().startsWith('values('));

        if (!valuesLine) {
            return null;
        }

        // Extract content between values( and )
        const match = valuesLine.match(/values\((.*)\)$/s);
        if (!match) {
            return null;
        }

        const valuesStr = match[1].trim();

        try {
            // Try to parse as JSON array first
            if (valuesStr.startsWith('[')) {
                return JSON.parse(valuesStr);
            }

            // Try to parse as single JSON value
            if (valuesStr.startsWith('{')) {
                return JSON.parse(valuesStr);
            }

            // Parse as comma-separated values
            const values = [];
            let current = '';
            let inQuotes = false;
            let escapeNext = false;

            for (let i = 0; i < valuesStr.length; i++) {
                const char = valuesStr[i];

                if (escapeNext) {
                    current += char;
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    inQuotes = !inQuotes;
                    current += char;
                    continue;
                }

                if (char === ',' && !inQuotes) {
                    values.push(this._parseValue(current.trim()));
                    current = '';
                    continue;
                }

                current += char;
            }

            if (current) {
                values.push(this._parseValue(current.trim()));
            }

            return values.length === 1 ? values[0] : values;

        } catch (error) {
            throw new SNLError(`Failed to parse values: ${error.message}`, command);
        }
    }

    /**
     * Parse individual value
     * @private
     */
    _parseValue(value) {
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1).replace(/\\"/g, '"');
        }

        // Try to parse as JSON
        try {
            return JSON.parse(value);
        } catch {
            // Return as string if not valid JSON
            return value;
        }
    }

    /**
     * Get required permission level for operation
     * @param {string} operation - SNL operation
     * @returns {number} Required permission level
     */
    getRequiredPermissionLevel(operation) {
        return this.permissionSNL.getRequiredPermissionLevel(operation);
    }

    /**
     * Build SNL response
     * @param {string} operation - Operation performed
     * @param {Object} result - Operation result
     * @returns {Object} Formatted response
     */
    buildSNLResponse(operation, result) {
        const response = {
            operation,
            timestamp: new Date().toISOString()
        };

        switch (operation) {
            case 'set':
            case 'tag':
            case 'untag':
            case 'remove':
            case 'drop':
                response.success = true;
                response.message = `Operation ${operation} completed successfully`;
                break;

            case 'view':
            case 'list':
            case 'search':
            case 'match':
                response.data = result;
                response.count = Array.isArray(result) ? result.length :
                              (result && typeof result === 'object' ? Object.keys(result).length : 0);
                break;

            case 'audit':
                response.audit = result;
                break;

            default:
                response.result = result;
        }

        return response;
    }

    /**
     * Check if operation modifies data
     * @param {string} operation - SNL operation
     * @returns {boolean}
     */
    isModificationOperation(operation) {
        const modificationOps = ['set', 'remove', 'drop', 'tag', 'untag'];
        return modificationOps.includes(operation.toLowerCase());
    }

    /**
     * Check if operation is read-only
     * @param {string} operation - SNL operation
     * @returns {boolean}
     */
    isReadOperation(operation) {
        const readOps = ['view', 'list', 'search', 'match', 'audit'];
        return readOps.includes(operation.toLowerCase());
    }

    /**
     * Validate entity type
     * @param {string} entityType - Entity type from SNL
     * @returns {boolean}
     */
    isValidEntityType(entityType) {
        return this.snl.validEntityTypes.includes(entityType);
    }

    /**
     * Format SNL error for response
     * @param {Error} error - Error object
     * @param {string} command - SNL command that caused error
     * @returns {Object} Formatted error
     */
    formatSNLError(error, command) {
        return {
            error: true,
            type: error.name || 'SNLError',
            message: error.message,
            command: command,
            timestamp: new Date().toISOString(),
            details: error instanceof SNLError ? error.snlCommand : null
        };
    }
}

module.exports = SNLManager;