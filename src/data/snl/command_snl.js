// src/data/snl/command_snl.js

const BaseSNL = require('./base_snl');

/**
 * Command SNL - Generates SNL commands for command/workflow operations
 */
class CommandSNL extends BaseSNL {
    constructor() {
        super();
        this.defaultDatabase = 'user-data';
        this.entity = 'commands';
    }

    /**
     * Get command by ID - CORRECTED: using view instead of one
     */
    getCommandSNL(database, namespace, commandId) {
        const path = this.buildPath(database, namespace, this.entity, commandId);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Create or update command
     */
    setCommandSNL(database, namespace, commandId, commandData) {
        const path = this.buildPath(database, namespace, this.entity);
        const values = [commandId, commandData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * List commands in namespace
     */
    listCommandsSNL(database, namespace, pattern = '*') {
        const path = this.buildPath(database, namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search commands
     */
    searchCommandsSNL(database, namespace, searchTerm) {
        const path = this.buildPath(database, namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove command
     */
    removeCommandSNL(database, namespace, commandId) {
        const path = this.buildPath(database, namespace, this.entity);
        return this.buildSNL('remove', 'structure', commandId, path);
    }

    /**
     * Tag command
     */
    tagCommandSNL(database, namespace, commandId, tagName) {
        const path = this.buildPath(database, namespace, this.entity, commandId);
        return this.buildSNL('tag', 'structure', tagName, path);
    }

    /**
     * Search commands by tags
     */
    matchCommandsByTagSNL(database, namespace, tags) {
        const path = this.buildPath(database, namespace);
        const tagList = Array.isArray(tags) ? tags.join(',') : tags;
        return this.buildSNL('match', 'tag', tagList, path);
    }

    /**
     * Store command execution result
     */
    setCommandResultSNL(database, namespace, commandId, executionId, result) {
        const resultsPath = this.buildPath(database, namespace, 'command_results', commandId);
        const values = [executionId, result];
        return this.buildSNL('set', 'structure', values, resultsPath);
    }

    /**
     * Get command execution results
     */
    getCommandResultsSNL(database, namespace, commandId) {
        const resultsPath = this.buildPath(database, namespace, 'command_results', commandId);
        return this.buildSNL('view', 'structure', null, resultsPath);
    }

    /**
     * Parse command from response
     */
    parseCommand(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const ids = Object.keys(response);
        if (ids.length === 0) {
            return null;
        }

        const commandId = ids[0];
        const commandData = response[commandId];

        return {
            id: commandId,
            ...commandData
        };
    }

    /**
     * Parse command list from response
     */
    parseCommandList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([id, commandData]) => ({
            id,
            ...commandData
        }));
    }

    /**
     * Validate command structure
     */
    validateCommandData(commandData) {
        const required = ['type', 'name'];
        const missing = required.filter(field => !commandData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required command fields: ${missing.join(', ')}`);
        }

        // Validate command type
        const validTypes = [
            'root', 'frontend', 'database', 'script',
            'ai', 'if', 'timer', 'goto', 'alert', 'cancel'
        ];

        if (!validTypes.includes(commandData.type)) {
            throw new Error(`Invalid command type: ${commandData.type}`);
        }

        return true;
    }

    /**
     * Build default namespace for user
     */
    getUserCommandNamespace(userEmail) {
        return this.formatEmailForNamespace(userEmail);
    }
}

module.exports = CommandSNL;