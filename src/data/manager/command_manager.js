// src/data/manager/command_manager.js

const Command = require('../../cross/entity/command');
const CommandSNL = require('../snl/command_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * CommandManager - Manages Command entity operations
 */
class CommandManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new CommandSNL();
        this.sender = new AISender();
        this.database = 'workflow';
        this.namespace = 'commands';
    }

    /**
     * Initialize commands structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.snl.checkCommandsEntitySNL(this.database, this.namespace);
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiToken);

            const exists = this.snl.parseCommandsList(checkResponse).length > 0;
            if (!exists) {
                const createCommand = this.snl.createCommandsEntitySNL(this.database, this.namespace);
                await this.sender.executeSNL(createCommand, this.aiToken);
                console.log('✅ Commands structure created');
            }
        } catch (error) {
            console.error('Failed to initialize commands structure:', error);
            throw error;
        }
    }

    /**
     * Save command (create or update)
     * @param {Command} command - Command entity
     * @returns {Promise<Command>}
     */
    async saveCommand(command) {
        try {
            const validation = command.validate();
            if (!validation.valid) {
                throw new ValidationError(`Command validation failed: ${validation.errors.join(', ')}`);
            }

            command.updatedAt = new Date().toISOString();
            const commandData = command.toObject();
            const snlCommand = this.snl.createCommandSNL(this.database, this.namespace, command.id, commandData);
            await this.sender.executeSNL(snlCommand, this.aiToken);

            console.log(`✅ Command saved: ${command.id}`);
            return command;
        } catch (error) {
            console.error('Failed to save command:', error);
            throw error;
        }
    }

    /**
     * Get command by ID
     * @param {string} commandId - Command ID
     * @returns {Promise<Command|null>}
     */
    async getCommand(commandId) {
        try {
            const snlCommand = this.snl.getCommandSNL(this.database, this.namespace, commandId);
            const response = await this.sender.executeSNL(snlCommand, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const commandData = this.snl.parseCommandData(response);
            return Command.fromObject(commandData);
        } catch (error) {
            console.error('Failed to get command:', error);
            throw error;
        }
    }

    /**
     * List commands with optional filters
     * @param {Object} options - Filter options
     * @returns {Promise<Command[]>}
     */
    async listCommands(options = {}) {
        try {
            const { page = 1, limit = 20, category, commandType, author } = options;

            const snlCommand = this.snl.listCommandsSNL(this.database, this.namespace);
            const response = await this.sender.executeSNL(snlCommand, this.aiToken);

            const commandIds = this.snl.parseCommandsList(response);
            const commands = [];

            for (const commandId of commandIds) {
                const command = await this.getCommand(commandId);
                if (command) {
                    // Apply filters
                    if (category && command.category !== category) continue;
                    if (commandType && command.commandType !== commandType) continue;
                    if (author && command.authorId !== author) continue;

                    commands.push(command);
                }
            }

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return commands.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to list commands:', error);
            throw error;
        }
    }

    /**
     * Search commands
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Promise<Command[]>}
     */
    async searchCommands(searchTerm, filters = {}) {
        try {
            const snlCommand = this.snl.searchCommandsSNL(this.database, this.namespace, searchTerm);
            const response = await this.sender.executeSNL(snlCommand, this.aiToken);

            const commandIds = this.snl.parseCommandsList(response);
            const commands = [];

            for (const commandId of commandIds) {
                const command = await this.getCommand(commandId);
                if (command) {
                    // Apply filters
                    if (filters.category && command.category !== filters.category) continue;
                    if (filters.commandType && command.commandType !== filters.commandType) continue;

                    commands.push(command);
                }
            }

            return commands;
        } catch (error) {
            console.error('Failed to search commands:', error);
            throw error;
        }
    }

    /**
     * Delete command
     * @param {string} commandId - Command ID
     * @returns {Promise<boolean>}
     */
    async deleteCommand(commandId) {
        try {
            // Check if command exists first
            const existingCommand = await this.getCommand(commandId);
            if (!existingCommand) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            // Prevent deletion of system commands
            if (existingCommand.isSystem) {
                throw new ValidationError(`Cannot delete system command: ${commandId}`);
            }

            const snlCommand = this.snl.deleteCommandSNL(this.database, this.namespace, commandId);
            await this.sender.executeSNL(snlCommand, this.aiToken);

            console.log(`✅ Command deleted: ${commandId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete command:', error);
            throw error;
        }
    }

    /**
     * Check if command exists
     * @param {string} commandId - Command ID
     * @returns {Promise<boolean>}
     */
    async commandExists(commandId) {
        try {
            const command = await this.getCommand(commandId);
            return command !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get commands by category
     * @param {string} category - Command category
     * @returns {Promise<Command[]>}
     */
    async getCommandsByCategory(category) {
        try {
            return await this.listCommands({ category });
        } catch (error) {
            console.error('Failed to get commands by category:', error);
            throw error;
        }
    }

    /**
     * Get commands by type
     * @param {string} commandType - Command type
     * @returns {Promise<Command[]>}
     */
    async getCommandsByType(commandType) {
        try {
            return await this.listCommands({ commandType });
        } catch (error) {
            console.error('Failed to get commands by type:', error);
            throw error;
        }
    }

    /**
     * Get commands by author
     * @param {string} authorId - Author ID
     * @returns {Promise<Command[]>}
     */
    async getCommandsByAuthor(authorId) {
        try {
            return await this.listCommands({ author: authorId });
        } catch (error) {
            console.error('Failed to get commands by author:', error);
            throw error;
        }
    }

    /**
     * Create example commands for AI
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async createExampleCommands(aiName) {
        try {
            console.log(`Creating example commands for AI: ${aiName}`);

            const examples = Command.createExampleCommands(aiName);

            for (const command of examples) {
                await this.saveCommand(command);
            }

            console.log(`✅ Example commands created for AI: ${aiName}`);
        } catch (error) {
            console.error(`Failed to create example commands for AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Update command status
     * @param {string} commandId - Command ID
     * @param {boolean} isActive - Active status
     * @returns {Promise<Command>}
     */
    async updateCommandStatus(commandId, isActive) {
        try {
            const command = await this.getCommand(commandId);
            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            command.isActive = isActive;
            command.updatedAt = new Date().toISOString();

            return await this.saveCommand(command);
        } catch (error) {
            console.error('Failed to update command status:', error);
            throw error;
        }
    }

    /**
     * Add tag to command
     * @param {string} commandId - Command ID
     * @param {string} tag - Tag to add
     * @returns {Promise<Command>}
     */
    async addTagToCommand(commandId, tag) {
        try {
            const command = await this.getCommand(commandId);
            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            command.addTag(tag);
            return await this.saveCommand(command);
        } catch (error) {
            console.error('Failed to add tag to command:', error);
            throw error;
        }
    }

    /**
     * Remove tag from command
     * @param {string} commandId - Command ID
     * @param {string} tag - Tag to remove
     * @returns {Promise<Command>}
     */
    async removeTagFromCommand(commandId, tag) {
        try {
            const command = await this.getCommand(commandId);
            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            command.removeTag(tag);
            return await this.saveCommand(command);
        } catch (error) {
            console.error('Failed to remove tag from command:', error);
            throw error;
        }
    }

    /**
     * Get command statistics
     * @returns {Promise<Object>}
     */
    async getCommandStatistics() {
        try {
            const allCommands = await this.listCommands({ limit: 1000 });

            const stats = {
                total: allCommands.length,
                active: allCommands.filter(cmd => cmd.isActive).length,
                inactive: allCommands.filter(cmd => !cmd.isActive).length,
                system: allCommands.filter(cmd => cmd.isSystem).length,
                byType: {},
                byCategory: {}
            };

            // Count by type
            allCommands.forEach(cmd => {
                stats.byType[cmd.commandType] = (stats.byType[cmd.commandType] || 0) + 1;
            });

            // Count by category
            allCommands.forEach(cmd => {
                stats.byCategory[cmd.category] = (stats.byCategory[cmd.category] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Failed to get command statistics:', error);
            throw error;
        }
    }
}

module.exports = CommandManager;