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

// src/core/support/timeline_service.js

const TimelineManager = require('../../data/manager/timeline_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const TimelineEntry = require('../../cross/entity/timeline_entry');
const { ValidationError } = require('../../cross/entity/errors');

/**
 * Timeline Service - Business logic for timeline operations
 */
class TimelineService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new TimelineManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Record new interaction in timeline
     */
    async recordInteraction(userInput, aiResponse, userEmail, metadata = {}, token) {
        try {
            const timelineEntry = new TimelineEntry({
                userInput,
                aiResponse,
                userEmail,
                aiName: this.aiName,
                metadata: {
                    ...metadata,
                    recordedAt: new Date().toISOString()
                }
            });

            const result = await this.manager.recordEntry(timelineEntry, token);

            return {
                ...result,
                entry: timelineEntry.toJSON()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get timeline entries by period
     */
    async getTimelineByPeriod(userEmail, year, month = null, day = null, hour = null, token) {
        try {
            if (!year || year < 2000 || year > 3000) {
                throw new ValidationError('Valid year is required');
            }

            if (month !== null && (month < 1 || month > 12)) {
                throw new ValidationError('Month must be between 1 and 12');
            }

            if (day !== null && (day < 1 || day > 31)) {
                throw new ValidationError('Day must be between 1 and 31');
            }

            if (hour !== null && (hour < 0 || hour > 23)) {
                throw new ValidationError('Hour must be between 0 and 23');
            }

            let entries = await this.manager.getEntriesByPeriod(userEmail, year, month, day, token);

            // Filter by hour if specified
            if (hour !== null) {
                entries = entries.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate.getUTCHours() === hour;
                });
            }

            return {
                period: { year, month, day, hour },
                count: entries.length,
                entries: entries.map(entry => entry.toJSON())
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Search timeline entries
     */
    async searchTimeline(userEmail, searchTerm, token) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                throw new ValidationError('Search term must be at least 2 characters');
            }

            const entries = await this.manager.searchEntries(userEmail, searchTerm.trim(), token);

            return {
                searchTerm,
                count: entries.length,
                entries: entries.map(entry => entry.toJSON())
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Add tag to timeline entry
     */
    async addTagToEntry(userEmail, entryId, tag, token) {
        try {
            if (!tag || tag.trim().length === 0) {
                throw new ValidationError('Tag is required');
            }

            // Parse entry ID to get year and month
            const { year, month } = this._parseEntryId(entryId);

            const result = await this.manager.addTagToEntry(userEmail, year, month, entryId, tag.trim(), token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get timeline summary/statistics
     */
    async getTimelineSummary(userEmail, token) {
        try {
            const entities = await this.manager.listTimelineEntities(userEmail, token);

            const summary = {
                totalMonths: entities.length,
                months: entities.map(entity => {
                    const [year, month] = entity.split('-');
                    return {
                        year: parseInt(year),
                        month: parseInt(month),
                        entity: entity
                    };
                }).sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                })
            };

            return summary;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get recent timeline entries
     */
    async getRecentEntries(userEmail, limit = 10, token) {
        try {
            const currentDate = new Date();
            const currentYear = currentDate.getUTCFullYear();
            const currentMonth = currentDate.getUTCMonth() + 1;

            // Try current month first
            let entries = await this.manager.getEntriesByPeriod(userEmail, currentYear, currentMonth, null, token);

            // If not enough entries, try previous month
            if (entries.length < limit) {
                const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

                const prevEntries = await this.manager.getEntriesByPeriod(userEmail, prevYear, prevMonth, null, token);
                entries = [...entries, ...prevEntries];
            }

            // Sort by timestamp desc and limit
            entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            entries = entries.slice(0, limit);

            return {
                limit,
                count: entries.length,
                entries: entries.map(entry => entry.toJSON())
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Parse entry ID to extract year and month
     */
    _parseEntryId(entryId) {
        // Entry ID format: day_hour_minute_second_ms
        // We need to get the year-month from context or current date
        // For now, assume current year-month
        const now = new Date();
        return {
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1
        };
    }

    /**
     * Generate summary for timeline entry (placeholder for AI integration)
     */
    async generateSummary(userInput, aiResponse) {
        try {
            // Placeholder - in future this will call AI service
            const maxLength = 100;
            const combined = `${userInput} ${aiResponse}`;

            if (combined.length <= maxLength) {
                return combined;
            }

            // Simple truncation with ellipsis
            return combined.substring(0, maxLength - 3) + '...';

        } catch (error) {
            console.warn('Failed to generate summary:', error);
            return null;
        }
    }
}

module.exports = TimelineService;

// src/core/support/config_service.js

const ConfigManager = require('../../data/manager/config_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const AIConfig = require('../../cross/entity/ai_config');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Config Service - Business logic for AI configuration
 */
class ConfigService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new ConfigManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(userPermissions, token) {
        try {
            const config = await this.manager.getAIConfig(this.aiName, token);

            return {
                config: config.toJSON(),
                canModify: this._canModifyConfig(userPermissions)
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update AI theme
     */
    async updateTheme(themeData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to modify AI configuration');
            }

            // Validate theme data
            this._validateThemeData(themeData);

            // Get current config
            const currentConfig = await this.manager.getAIConfig(this.aiName, token);

            // Update theme
            currentConfig.updateTheme(themeData);
            currentConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(currentConfig, token);

            return {
                ...result,
                theme: currentConfig.theme
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update AI behavior
     */
    async updateBehavior(behaviorData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to modify AI configuration');
            }

            // Validate behavior data
            this._validateBehaviorData(behaviorData);

            // Get current config
            const currentConfig = await this.manager.getAIConfig(this.aiName, token);

            // Update behavior
            currentConfig.updateBehavior(behaviorData);
            currentConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(currentConfig, token);

            return {
                ...result,
                behavior: currentConfig.behavior
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(userPermissions, token) {
        try {
            const override = await this.manager.getBehaviorOverride(this.aiName, token);

            return {
                override,
                canModify: this._canModifyConfig(userPermissions)
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(behaviorData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to set behavior override');
            }

            // Validate behavior data
            this._validateBehaviorData(behaviorData);

            const result = await this.manager.setBehaviorOverride(this.aiName, behaviorData, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset to default configuration
     */
    async resetToDefault(userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to reset configuration');
            }

            const defaultConfig = new AIConfig({ aiName: this.aiName });
            defaultConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(defaultConfig, token);

            return {
                ...result,
                config: defaultConfig.toJSON()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if user can modify configuration
     */
    _canModifyConfig(userPermissions) {
        // User needs admin permission on main database
        const mainPermission = userPermissions.find(p => p.database === 'main');
        return mainPermission && mainPermission.level >= 3;
    }

    /**
     * Validate theme data
     */
    _validateThemeData(themeData) {
        const errors = [];

        if (!themeData || typeof themeData !== 'object') {
            throw new ValidationError('Theme data must be an object');
        }

        // Validate primary colors if provided
        if (themeData.primaryColors) {
            const requiredPrimary = ['black', 'white', 'darkBlue', 'darkPurple'];
            for (const color of requiredPrimary) {
                if (themeData.primaryColors[color] && !this._isValidColor(themeData.primaryColors[color])) {
                    errors.push(`Invalid primary color ${color}`);
                }
            }
        }

        // Validate secondary colors if provided
        if (themeData.secondaryColors) {
            const requiredSecondary = ['purple', 'turquoise', 'blue', 'teal'];
            for (const color of requiredSecondary) {
                if (themeData.secondaryColors[color] && !this._isValidColor(themeData.secondaryColors[color])) {
                    errors.push(`Invalid secondary color ${color}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Theme validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Validate behavior data
     */
    _validateBehaviorData(behaviorData) {
        if (!behaviorData || typeof behaviorData !== 'object') {
            throw new ValidationError('Behavior data must be an object');
        }

        // Validate required fields if provided
        const stringFields = ['greeting', 'personality', 'defaultContext', 'responseStyle'];
        for (const field of stringFields) {
            if (behaviorData[field] && typeof behaviorData[field] !== 'string') {
                throw new ValidationError(`${field} must be a string`);
            }
        }
    }

    /**
     * Validate color format (hex)
     */
    _isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
}

module.exports = ConfigService;