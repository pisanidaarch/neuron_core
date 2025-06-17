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
     * Set command (create or update)
     */
    async setCommand(commandData, userPermissions, userEmail, token) {
        try {
            // Create appropriate command type
            const command = this._createCommandByType(commandData);

            // Determine storage location
            const { database, namespace } = this._determineStorageLocation(commandData, userPermissions, userEmail);

            // Validate user can set commands in this location
            await this._validateWritePermission(database, namespace, userPermissions, userEmail);

            // Set metadata
            command.createdBy = userEmail;
            if (!command.createdAt) {
                command.createdAt = new Date().toISOString();
            }
            command.updatedAt = new Date().toISOString();

            // Set command
            const result = await this.manager.setCommand(command, database, namespace, token);

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
     * Get command
     */
    async getCommand(commandId, searchLocation, userPermissions, userEmail, token) {
        try {
            const locations = searchLocation || this._getSearchLocations(userPermissions, userEmail);

            for (const location of locations) {
                try {
                    const command = await this.manager.getCommand(commandId, location.database, location.namespace, token);
                    if (command) {
                        // Validate user can read this command
                        await this._validateReadPermission(location.database, location.namespace, userPermissions, userEmail);

                        return {
                            command,
                            location
                        };
                    }
                } catch (error) {
                    // Continue searching in other locations
                    console.debug(`Command not found in ${location.database}.${location.namespace}`);
                }
            }

            return null;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update command (uses set internally)
     */
    async updateCommand(commandId, updateData, searchLocation, userPermissions, userEmail, token) {
        try {
            // Find existing command
            const existing = await this.getCommand(commandId, searchLocation, userPermissions, userEmail, token);
            if (!existing) {
                throw new Error(`Command not found: ${commandId}`);
            }

            // Merge update data
            const updatedCommand = this._updateCommandData(existing.command, updateData);
            updatedCommand.updatedBy = userEmail;
            updatedCommand.updatedAt = new Date().toISOString();

            // Use setCommand to update
            const result = await this.manager.setCommand(updatedCommand, existing.location.database, existing.location.namespace, token);

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
     * Remove command
     */
    async removeCommand(commandId, searchLocation, userPermissions, userEmail, token) {
        try {
            // Find existing command
            const existing = await this.getCommand(commandId, searchLocation, userPermissions, userEmail, token);
            if (!existing) {
                throw new Error(`Command not found: ${commandId}`);
            }

            // Validate user can remove this command
            await this._validateWritePermission(existing.location.database, existing.location.namespace, userPermissions, userEmail);

            const result = await this.manager.removeCommand(commandId, existing.location.database, existing.location.namespace, token);

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
     * List commands
     */
    async listCommands(location, pattern, userPermissions, userEmail, token) {
        try {
            const locations = location ? [location] : this._getSearchLocations(userPermissions, userEmail);
            const results = [];

            for (const loc of locations) {
                try {
                    // Validate read permission
                    await this._validateReadPermission(loc.database, loc.namespace, userPermissions, userEmail);

                    const commands = await this.manager.listCommands({
                        database: loc.database,
                        namespace: loc.namespace,
                        pattern
                    }, token);

                    if (commands && commands.length > 0) {
                        results.push({
                            location: loc,
                            commands
                        });
                    }
                } catch (error) {
                    console.warn(`List failed in ${loc.database}.${loc.namespace}:`, error.message);
                }
            }

            return results;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Create command by type
     * @private
     */
    _createCommandByType(commandData) {
        const { commandType } = commandData;

        switch (commandType) {
            case 'root':
                return new RootCommand(commandData);
            case 'frontend':
                return new FrontendCommand(commandData);
            case 'database':
                return new DatabaseCommand(commandData);
            case 'script':
                return new ScriptCommand(commandData);
            case 'ai':
                return new AICommand(commandData);
            case 'if':
                return new IfCommand(commandData);
            case 'timer':
                return new TimerCommand(commandData);
            case 'goto':
                return new GoToCommand(commandData);
            case 'alert':
                return new AlertCommand(commandData);
            default:
                return new Command(commandData);
        }
    }

    /**
     * Determine storage location for command
     * @private
     */
    _determineStorageLocation(commandData, userPermissions, userEmail) {
        // If explicitly specified
        if (commandData.database && commandData.namespace) {
            return {
                database: commandData.database,
                namespace: commandData.namespace
            };
        }

        // Default to user's personal space
        const userNamespace = this._formatEmailForNamespace(userEmail);
        return {
            database: 'user-data',
            namespace: userNamespace
        };
    }

    /**
     * Get search locations based on permissions
     * @private
     */
    _getSearchLocations(userPermissions, userEmail) {
        const locations = [];

        // Always include user's personal space
        const userNamespace = this._formatEmailForNamespace(userEmail);
        locations.push({
            database: 'user-data',
            namespace: userNamespace
        });

        // Add locations from permissions
        userPermissions.forEach(perm => {
            if (perm.database && perm.level >= 1) { // Read permission
                locations.push({
                    database: perm.database,
                    namespace: perm.namespace || 'default'
                });
            }
        });

        return locations;
    }

    /**
     * Validate read permission
     * @private
     */
    async _validateReadPermission(database, namespace, userPermissions, userEmail) {
        // User always has read access to their own space
        const userNamespace = this._formatEmailForNamespace(userEmail);
        if (database === 'user-data' && namespace === userNamespace) {
            return true;
        }

        // Check permissions
        const permission = userPermissions.find(p =>
            p.database === database &&
            (!p.namespace || p.namespace === namespace)
        );

        if (!permission || permission.level < 1) {
            throw new AuthorizationError(`No read permission for ${database}.${namespace}`);
        }

        return true;
    }

    /**
     * Validate write permission
     * @private
     */
    async _validateWritePermission(database, namespace, userPermissions, userEmail) {
        // User always has write access to their own space
        const userNamespace = this._formatEmailForNamespace(userEmail);
        if (database === 'user-data' && namespace === userNamespace) {
            return true;
        }

        // Check permissions
        const permission = userPermissions.find(p =>
            p.database === database &&
            (!p.namespace || p.namespace === namespace)
        );

        if (!permission || permission.level < 2) {
            throw new AuthorizationError(`No write permission for ${database}.${namespace}`);
        }

        return true;
    }

    /**
     * Update command data
     * @private
     */
    _updateCommandData(existingCommand, updateData) {
        const updated = { ...existingCommand.toObject(), ...updateData };

        // Preserve original metadata
        updated.id = existingCommand.id;
        updated.createdAt = existingCommand.createdAt;
        updated.createdBy = existingCommand.createdBy;
        updated.commandType = existingCommand.commandType;

        return this._createCommandByType(updated);
    }

    /**
     * Format email for namespace
     * @private
     */
    _formatEmailForNamespace(email) {
        return email.replace(/\./g, '_').replace('@', '_at_');
    }
}

module.exports = CommandService;