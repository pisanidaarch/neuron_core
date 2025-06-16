// src/core/support/command_service.js

const CommandManager = require('../../data/manager/command_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const Command = require('../../cross/entity/command');
const RootCommand = require('../../cross/entity/root_command');
const FrontendCommand = require('../../cross/entity/frontend_command');
const DatabaseCommand = require('../../cross/entity/database_command');
const ScriptCommand = require('../../cross/entity/script_command');
const AICommand = require('../../cross/entity/ai_command');
const IfCommand = require('../../cross/entity/if_command');
const TimerCommand = require('../../cross/entity/timer_command');
const GoToCommand = require('../../cross/entity/goto_command');
const AlertCommand = require('../../cross/entity/alert_command');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Command Service - Business logic for command operations
 */
class CommandService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new CommandManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Create new command
     */
    async createCommand(commandData, userPermissions, userEmail, token) {
        try {
            // Create appropriate command type
            const command = this._createCommandByType(commandData);

            // Determine storage location
            const { database, namespace } = this._determineStorageLocation(commandData, userPermissions, userEmail);

            // Validate user can create commands in this location
            await this._validateCreatePermission(database, namespace, userPermissions, userEmail);

            // Set metadata
            command.createdBy = userEmail;
            command.createdAt = new Date().toISOString();
            command.updatedAt = new Date().toISOString();

            // Create command
            const result = await this.manager.createCommand(command, database, namespace, token);

            return {
                ...result,
                database,
                namespace,
                commandType: command.commandType
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get command by ID
     */
    async getCommand(commandId, searchLocation, userPermissions, userEmail, token) {
        try {
            const locations = searchLocation || this._getSearchLocations(userPermissions, userEmail);

            for (const location of locations) {
                try {
                    const command = await this.manager.getCommand(commandId, location.database, location.namespace, token);
                    if (command) {
                        return {
                            command,
                            location
                        };
                    }
                } catch (error) {
                    // Continue searching in other locations
                    console.warn(`Command not found in ${location.database}.${location.namespace}`);
                }
            }

            return null;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List commands
     */
    async listCommands(location, pattern, userPermissions, userEmail, token) {
        try {
            // If no location specified, search in user's data first
            if (!location) {
                location = this._getUserDataLocation(userEmail);
            }

            // Validate user can access this location
            await this._validateReadPermission(location.database, location.namespace, userPermissions, userEmail);

            const commandIds = await this.manager.listCommands(location.database, location.namespace, token, pattern);

            return {
                commands: commandIds,
                location
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update command
     */
    async updateCommand(commandId, updateData, searchLocation, userPermissions, userEmail, token) {
        try {
            // Find existing command
            const existing = await this.getCommand(commandId, searchLocation, userPermissions, userEmail, token);
            if (!existing) {
                throw new Error(`Command not found: ${commandId}`);
            }

            // Validate user can modify this command
            await this._validateWritePermission(existing.location.database, existing.location.namespace, userPermissions, userEmail);

            // Update command data
            const updatedCommand = this._updateCommandData(existing.command, updateData);
            updatedCommand.updatedBy = userEmail;
            updatedCommand.updatedAt = new Date().toISOString();

            const result = await this.manager.updateCommand(updatedCommand, existing.location.database, existing.location.namespace, token);

            return {
                ...result,
                location: existing.location,
                commandType: updatedCommand.commandType
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete command
     */
    async deleteCommand(commandId, searchLocation, userPermissions, userEmail, token) {
        try {
            // Find existing command
            const existing = await this.getCommand(commandId, searchLocation, userPermissions, userEmail, token);
            if (!existing) {
                throw new Error(`Command not found: ${commandId}`);
            }

            // Validate user can delete this command
            await this._validateWritePermission(existing.location.database, existing.location.namespace, userPermissions, userEmail);

            const result = await this.manager.deleteCommand(commandId, existing.location.database, existing.location.namespace, token);

            return {
                ...result,
                location: existing.location
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Search commands
     */
    async searchCommands(searchTerm, locations, userPermissions, userEmail, token) {
        try {
            const searchLocations = locations || this._getSearchLocations(userPermissions, userEmail);
            const results = [];

            for (const location of searchLocations) {
                try {
                    const searchResult = await this.manager.searchCommands(searchTerm, location.database, location.namespace, token);
                    if (searchResult && searchResult.length > 0) {
                        results.push({
                            location,
                            results: searchResult
                        });
                    }
                } catch (error) {
                    console.warn(`Search failed in ${location.database}.${location.namespace}:`, error.message);
                }
            }

            return results;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create command by type
     */
    _createCommandByType(commandData) {
        const commandClasses = {
            'root': RootCommand,
            'frontend': FrontendCommand,
            'database': DatabaseCommand,
            'script': ScriptCommand,
            'ai': AICommand,
            'if': IfCommand,
            'timer': TimerCommand,
            'goto': GoToCommand,
            'alert': AlertCommand
        };

        const CommandClass = commandClasses[commandData.commandType] || Command;
        return new CommandClass(commandData);
    }

    /**
     * Determine storage location for command
     */
    _determineStorageLocation(commandData, userPermissions, userEmail) {
        // If user specifies a location and has permission, use it
        if (commandData.database && commandData.namespace) {
            const hasPermission = userPermissions.some(p =>
                p.database === commandData.database && p.level >= 2
            );

            if (hasPermission) {
                return {
                    database: commandData.database,
                    namespace: commandData.namespace
                };
            }
        }

        // Default to user's data area
        return this._getUserDataLocation(userEmail);
    }

    /**
     * Get user data location
     */
    _getUserDataLocation(userEmail) {
        const namespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
        return {
            database: 'user-data',
            namespace: namespace
        };
    }

    /**
     * Get search locations for commands
     */
    _getSearchLocations(userPermissions, userEmail) {
        const locations = [];

        // Add user's data first
        locations.push(this._getUserDataLocation(userEmail));

        // Add databases user has permission to access (excluding main, timeline)
        const excludeDatabases = ['main', 'timeline', 'user-data'];
        userPermissions.forEach(permission => {
            if (!excludeDatabases.includes(permission.database) && permission.level >= 1) {
                // Would need to get namespaces from database - simplified for now
                locations.push({
                    database: permission.database,
                    namespace: '*' // Will need to expand this
                });
            }
        });

        // Add global database last
        const hasGlobalAccess = userPermissions.some(p => p.database === 'global');
        if (hasGlobalAccess) {
            locations.push({
                database: 'global',
                namespace: 'commands'
            });
        }

        return locations;
    }

    /**
     * Update command data preserving type-specific fields
     */
    _updateCommandData(existingCommand, updateData) {
        const updated = { ...existingCommand.toJSON(), ...updateData };
        return this._createCommandByType(updated);
    }

    /**
     * Validate create permission
     */
    async _validateCreatePermission(database, namespace, userPermissions, userEmail) {
        return this._validateWritePermission(database, namespace, userPermissions, userEmail);
    }

    /**
     * Validate read permission
     */
    async _validateReadPermission(database, namespace, userPermissions, userEmail) {
        // User always has access to their own data
        const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
        if (database === 'user-data' && namespace === userDataNamespace) {
            return true;
        }

        // Check permissions
        const permission = userPermissions.find(p => p.database === database);
        if (!permission || permission.level < 1) {
            throw new AuthorizationError(`Insufficient permissions to read from ${database}`);
        }

        return true;
    }

    /**
     * Validate write permission
     */
    async _validateWritePermission(database, namespace, userPermissions, userEmail) {
        // User always has write access to their own data
        const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
        if (database === 'user-data' && namespace === userDataNamespace) {
            return true;
        }

        // Check permissions
        const permission = userPermissions.find(p => p.database === database);
        if (!permission || permission.level < 2) {
            throw new AuthorizationError(`Insufficient permissions to write to ${database}`);
        }

        return true;
    }
}

module.exports = CommandService;

