// src/data/snl/command_snl.js

/**
 * Command SNL - SNL operations for command management
 */
class CommandSNL {
    constructor() {
        // SNL commands for command CRUD operations
    }

    /**
     * Create command SNL
     */
    createCommandSNL(database, namespace, commandId, command) {
        return `set(structure)\nvalues("${commandId}", ${JSON.stringify(command)})\non(${database}.${namespace}.commands)`;
    }

    /**
     * Get command SNL
     */
    getCommandSNL(database, namespace, commandId) {
        return `one(structure, id)\nvalues("${commandId}")\non(${database}.${namespace}.commands)`;
    }

    /**
     * List commands SNL
     */
    listCommandsSNL(database, namespace, pattern = '*') {
        return `list(structure)\nvalues("${pattern}")\non(${database}.${namespace})`;
    }

    /**
     * Update command SNL
     */
    updateCommandSNL(database, namespace, commandId, command) {
        return `set(structure)\nvalues("${commandId}", ${JSON.stringify(command)})\non(${database}.${namespace}.commands)`;
    }

    /**
     * Delete command SNL
     */
    deleteCommandSNL(database, namespace, commandId) {
        return `remove(structure)\nvalues("${commandId}")\non(${database}.${namespace}.commands)`;
    }

    /**
     * Search commands SNL
     */
    searchCommandsSNL(database, namespace, searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${database}.${namespace}.commands)`;
    }

    /**
     * Check if commands entity exists
     */
    checkCommandsEntitySNL(database, namespace) {
        return `list(structure)\nvalues("commands")\non(${database}.${namespace})`;
    }

    /**
     * Create commands entity if not exists
     */
    createCommandsEntitySNL(database, namespace) {
        return `set(structure)\nvalues("commands", {})\non(${database}.${namespace}.commands)`;
    }

    /**
     * Parse command list response
     */
    parseCommandsList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.keys(response).filter(key => key !== 'commands');
    }

    /**
     * Parse command data response
     */
    parseCommandData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return response;
    }

    /**
     * Validate command structure
     */
    validateCommandStructure(command) {
        const required = ['id', 'name', 'commandType'];
        const missing = required.filter(field => !command[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        return true;
    }
}

module.exports = CommandSNL;

