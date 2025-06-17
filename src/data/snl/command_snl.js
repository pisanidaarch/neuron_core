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
     * Get command by ID
     */
    getCommandSNL(database, namespace, commandId) {
        const path = this.buildPath(database, namespace, this.entity, commandId);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Set command (create or update)
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
     * Remove command from entity
     */
    removeCommandSNL(database, namespace, commandId) {
        const path = this.buildPath(database, namespace, this.entity);
        return this.buildSNL('remove', 'structure', commandId, path);
    }

    /**
     * Drop entire commands entity
     */
    dropCommandsEntitySNL(database, namespace) {
        const path = this.buildPath(database, namespace, this.entity);
        return this.buildSNL('drop', 'structure', null, path);
    }

    /**
     * Tag command
     */
    tagCommandSNL(database, namespace, commandId, tagName) {
        const path = this.buildPath(database, namespace, this.entity, commandId);
        return this.buildSNL('tag', 'structure', tagName, path);
    }

    /**
     * Untag command
     */
    untagCommandSNL(database, namespace, commandId, tagName) {
        const path = this.buildPath(database, namespace, this.entity, commandId);
        return this.buildSNL('untag', 'structure', tagName, path);
    }

    /**
     * Search commands by tags using match
     */
    matchCommandsByTagSNL(database, namespace, tags) {
        const path = this.buildPath(database, namespace);
        const tagList = Array.isArray(tags) ? tags.join(',') : tags;
        return this.buildSNL('match', 'tag', tagList, path);
    }

    /**
     * Check if commands entity exists
     */
    checkCommandsEntitySNL(database, namespace) {
        const path = this.buildPath(database, namespace);
        return this.buildSNL('list', 'structure', this.entity, path);
    }

    /**
     * Parse command data from response
     */
    parseCommandData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Handle structure response format
        const keys = Object.keys(response);
        if (keys.length === 0) {
            return null;
        }

        // Get first entry (should be the command ID)
        const commandId = keys[0];
        const commandData = response[commandId];

        return {
            id: commandId,
            ...commandData
        };
    }

    /**
     * Parse commands list from response
     */
    parseCommandsList(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response;
    }

    /**
     * Validate command ID format
     */
    validateCommandId(commandId) {
        if (!commandId || typeof commandId !== 'string' || commandId.trim().length === 0) {
            throw new Error('Command ID is required');
        }

        // Command IDs should follow a specific format
        if (!/^[a-zA-Z0-9_-]+$/.test(commandId)) {
            throw new Error('Command ID can only contain letters, numbers, dashes, and underscores');
        }

        return true;
    }
}

module.exports = CommandSNL;