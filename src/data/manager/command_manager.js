// src/data/manager/command_manager.js

const CommandSNL = require('../snl/command_snl');
const NeuronDBSender = require('../neuron_db/sender');
const Command = require('../../cross/entity/command');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Command Manager - Manages command CRUD operations
 */
class CommandManager {
    constructor() {
        this.snl = new CommandSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Create new command
     */
    async createCommand(command, database, namespace, token) {
        try {
            // Validate command
            const errors = command.validate();
            if (errors.length > 0) {
                throw new Error(`Command validation failed: ${errors.join(', ')}`);
            }

            this.snl.validateCommandStructure(command.toJSON());

            // Check if commands entity exists, create if not
            await this._ensureCommandsEntity(database, namespace, token);

            // Create command
            const createSNL = this.snl.createCommandSNL(database, namespace, command.id, command.toJSON());
            const response = await this.sender.executeSNL(createSNL, token);

            return {
                success: true,
                commandId: command.id,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to create command: ${error.message}`);
        }
    }

    /**
     * Get command by ID
     */
    async getCommand(commandId, database, namespace, token) {
        try {
            const getSNL = this.snl.getCommandSNL(database, namespace, commandId);
            const response = await this.sender.executeSNL(getSNL, token);

            if (!response) {
                return null;
            }

            const commandData = this.snl.parseCommandData(response);
            return commandData ? new Command(commandData) : null;

        } catch (error) {
            throw new NeuronDBError(`Failed to get command: ${error.message}`);
        }
    }

    /**
     * List commands
     */
    async listCommands(database, namespace, token, pattern = '*') {
        try {
            const listSNL = this.snl.listCommandsSNL(database, namespace, pattern);
            const response = await this.sender.executeSNL(listSNL, token);

            const commandIds = this.snl.parseCommandsList(response);
            return commandIds;

        } catch (error) {
            throw new NeuronDBError(`Failed to list commands: ${error.message}`);
        }
    }

    /**
     * Update command
     */
    async updateCommand(command, database, namespace, token) {
        try {
            // Validate command
            const errors = command.validate();
            if (errors.length > 0) {
                throw new Error(`Command validation failed: ${errors.join(', ')}`);
            }

            // Update timestamp
            command.updatedAt = new Date().toISOString();

            const updateSNL = this.snl.updateCommandSNL(database, namespace, command.id, command.toJSON());
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                commandId: command.id,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update command: ${error.message}`);
        }
    }

    /**
     * Delete command
     */
    async deleteCommand(commandId, database, namespace, token) {
        try {
            const deleteSNL = this.snl.deleteCommandSNL(database, namespace, commandId);
            const response = await this.sender.executeSNL(deleteSNL, token);

            return {
                success: true,
                commandId: commandId,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to delete command: ${error.message}`);
        }
    }

    /**
     * Search commands
     */
    async searchCommands(searchTerm, database, namespace, token) {
        try {
            const searchSNL = this.snl.searchCommandsSNL(database, namespace, searchTerm);
            const response = await this.sender.executeSNL(searchSNL, token);

            return response || [];

        } catch (error) {
            throw new NeuronDBError(`Failed to search commands: ${error.message}`);
        }
    }

    /**
     * Ensure commands entity exists
     */
    async _ensureCommandsEntity(database, namespace, token) {
        try {
            const checkSNL = this.snl.checkCommandsEntitySNL(database, namespace);
            const response = await this.sender.executeSNL(checkSNL, token);

            const entities = this.snl.parseCommandsList(response);
            if (!entities.includes('commands')) {
                const createSNL = this.snl.createCommandsEntitySNL(database, namespace);
                await this.sender.executeSNL(createSNL, token);
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure commands entity:', error.message);
        }
    }
}

module.exports = CommandManager;

