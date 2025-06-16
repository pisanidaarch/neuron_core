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

// src/data/manager/timeline_manager.js

const TimelineSNL = require('../snl/timeline_snl');
const NeuronDBSender = require('../neuron_db/sender');
const TimelineEntry = require('../../cross/entity/timeline_entry');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Timeline Manager - Manages timeline operations
 */
class TimelineManager {
    constructor() {
        this.snl = new TimelineSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Record new timeline entry
     */
    async recordEntry(timelineEntry, token) {
        try {
            // Validate entry
            const errors = timelineEntry.validate();
            if (errors.length > 0) {
                throw new Error(`Timeline entry validation failed: ${errors.join(', ')}`);
            }

            // Generate ID and entity name
            timelineEntry.generateId();
            const entityName = timelineEntry.getEntityName();

            // Ensure timeline entity exists
            await this._ensureTimelineEntity(timelineEntry.userEmail, entityName, token);

            // Create entry
            const createSNL = this.snl.createTimelineEntrySNL(
                timelineEntry.userEmail,
                entityName,
                timelineEntry.id,
                timelineEntry.toJSON()
            );

            const response = await this.sender.executeSNL(createSNL, token);

            return {
                success: true,
                entryId: timelineEntry.id,
                entityName: entityName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to record timeline entry: ${error.message}`);
        }
    }

    /**
     * Get timeline entries by period
     */
    async getEntriesByPeriod(userEmail, year, month = null, day = null, token) {
        try {
            if (month === null) {
                // Get all entries for the year
                return await this._getEntriesForYear(userEmail, year, token);
            }

            const entityName = `${year}-${month.toString().padStart(2, '0')}`;
            const entriesSNL = this.snl.getTimelineEntriesSNL(userEmail, entityName);
            const response = await this.sender.executeSNL(entriesSNL, token);

            let entries = this.snl.parseTimelineEntries(response);

            // Filter by day if specified
            if (day !== null) {
                entries = entries.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate.getUTCDate() === day;
                });
            }

            return entries.map(entry => new TimelineEntry(entry));

        } catch (error) {
            throw new NeuronDBError(`Failed to get timeline entries: ${error.message}`);
        }
    }

    /**
     * Search timeline entries
     */
    async searchEntries(userEmail, searchTerm, token) {
        try {
            const searchSNL = this.snl.searchTimelineSNL(userEmail, searchTerm);
            const response = await this.sender.executeSNL(searchSNL, token);

            const entries = this.snl.parseTimelineSearch(response);
            return entries.map(entry => new TimelineEntry(entry));

        } catch (error) {
            throw new NeuronDBError(`Failed to search timeline: ${error.message}`);
        }
    }

    /**
     * Add tag to timeline entry
     */
    async addTagToEntry(userEmail, year, month, entryId, tag, token) {
        try {
            const entityName = `${year}-${month.toString().padStart(2, '0')}`;
            const tagSNL = this.snl.addTagToTimelineEntrySNL(userEmail, entityName, entryId, tag);
            const response = await this.sender.executeSNL(tagSNL, token);

            return {
                success: true,
                entryId: entryId,
                tag: tag,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to add tag to timeline entry: ${error.message}`);
        }
    }

    /**
     * List available timeline entities (months)
     */
    async listTimelineEntities(userEmail, token) {
        try {
            const listSNL = this.snl.listTimelineEntitiesSNL(userEmail);
            const response = await this.sender.executeSNL(listSNL, token);

            return Array.isArray(response) ? response : [];

        } catch (error) {
            throw new NeuronDBError(`Failed to list timeline entities: ${error.message}`);
        }
    }

    /**
     * Get entries for entire year
     */
    async _getEntriesForYear(userEmail, year, token) {
        const allEntries = [];

        // Get all months for the year
        for (let month = 1; month <= 12; month++) {
            try {
                const monthEntries = await this.getEntriesByPeriod(userEmail, year, month, null, token);
                allEntries.push(...monthEntries);
            } catch (error) {
                // Month might not exist, continue
                console.warn(`No entries found for ${year}-${month.toString().padStart(2, '0')}`);
            }
        }

        return allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Ensure timeline entity exists
     */
    async _ensureTimelineEntity(userEmail, entityName, token) {
        try {
            const checkSNL = this.snl.checkTimelineEntitySNL(userEmail, entityName);
            const response = await this.sender.executeSNL(checkSNL, token);

            if (!response || (Array.isArray(response) && !response.includes(entityName))) {
                const createSNL = this.snl.createTimelineEntitySNL(userEmail, entityName);
                await this.sender.executeSNL(createSNL, token);
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure timeline entity:', error.message);
        }
    }
}

module.exports = TimelineManager;

// src/data/manager/config_manager.js

const ConfigSNL = require('../snl/config_snl');
const NeuronDBSender = require('../neuron_db/sender');
const AIConfig = require('../../cross/entity/ai_config');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Config Manager - Manages AI configuration
 */
class ConfigManager {
    constructor() {
        this.snl = new ConfigSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(aiName, token) {
        try {
            const getSNL = this.snl.getAIConfigSNL(aiName);
            const response = await this.sender.executeSNL(getSNL, token);

            if (!response) {
                // Return default config if none exists
                return new AIConfig({ aiName });
            }

            const configData = this.snl.parseAIConfig(response);
            return new AIConfig({ aiName, ...configData });

        } catch (error) {
            throw new NeuronDBError(`Failed to get AI config: ${error.message}`);
        }
    }

    /**
     * Update AI configuration
     */
    async updateAIConfig(aiConfig, token) {
        try {
            // Validate config
            const errors = aiConfig.validate();
            if (errors.length > 0) {
                throw new Error(`AI config validation failed: ${errors.join(', ')}`);
            }

            this.snl.validateConfigStructure(aiConfig.toJSON());

            // Ensure config entity exists
            await this._ensureConfigEntity(token);

            const updateSNL = this.snl.setAIConfigSNL(aiConfig.aiName, aiConfig.toJSON());
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiConfig.aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI config: ${error.message}`);
        }
    }

    /**
     * Update AI theme only
     */
    async updateAITheme(aiName, theme, token) {
        try {
            const updateSNL = this.snl.updateAIThemeSNL(aiName, theme);
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI theme: ${error.message}`);
        }
    }

    /**
     * Update AI behavior only
     */
    async updateAIBehavior(aiName, behavior, token) {
        try {
            const updateSNL = this.snl.updateAIBehaviorSNL(aiName, behavior);
            const response = await this.sender.executeSNL(updateSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to update AI behavior: ${error.message}`);
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(aiName, token) {
        try {
            const getSNL = this.snl.getBehaviorOverrideSNL(aiName);
            const response = await this.sender.executeSNL(getSNL, token);

            return response || null;

        } catch (error) {
            throw new NeuronDBError(`Failed to get behavior override: ${error.message}`);
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(aiName, behavior, token) {
        try {
            const setSNL = this.snl.setBehaviorOverrideSNL(aiName, behavior);
            const response = await this.sender.executeSNL(setSNL, token);

            return {
                success: true,
                aiName: aiName,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to set behavior override: ${error.message}`);
        }
    }

    /**
     * Ensure config entity exists
     */
    async _ensureConfigEntity(token) {
        try {
            const checkSNL = this.snl.checkAIConfigSNL();
            const response = await this.sender.executeSNL(checkSNL, token);

            if (!response || (Array.isArray(response) && !response.includes('ai_config'))) {
                const defaultConfig = new AIConfig({ aiName: 'default' });
                const createSNL = this.snl.createAIConfigSNL('default', defaultConfig.toJSON());
                await this.sender.executeSNL(createSNL, token);
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure config entity:', error.message);
        }
    }
}

module.exports = ConfigManager;

// src/data/manager/tag_manager.js

const TagSNL = require('../snl/tag_snl');
const NeuronDBSender = require('../neuron_db/sender');
const TagInfo = require('../../cross/entity/tag_info');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Tag Manager - Manages tag operations
 */
class TagManager {
    constructor() {
        this.snl = new TagSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Add tag to entity
     */
    async addTag(database, namespace, entity, tag, userEmail, token) {
        try {
            this.snl.validateTagName(tag);

            const addSNL = this.snl.addTagSNL(database, namespace, entity, tag);
            const response = await this.sender.executeSNL(addSNL, token);

            return {
                success: true,
                tag: tag,
                path: `${database}.${namespace}.${entity}`,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to add tag: ${error.message}`);
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(database, namespace, entity, tag, token) {
        try {
            this.snl.validateTagName(tag);

            const removeSNL = this.snl.removeTagSNL(database, namespace, entity, tag);
            const response = await this.sender.executeSNL(removeSNL, token);

            return {
                success: true,
                tag: tag,
                path: `${database}.${namespace}.${entity}`,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to remove tag: ${error.message}`);
        }
    }

    /**
     * List all tags
     */
    async listTags(database = null, pattern = '*', token) {
        try {
            const listSNL = this.snl.listTagsSNL(database, pattern);
            const response = await this.sender.executeSNL(listSNL, token);

            return this.snl.parseTagsList(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to list tags: ${error.message}`);
        }
    }

    /**
     * Match tags by patterns
     */
    async matchTags(patterns, database = null, token) {
        try {
            if (!Array.isArray(patterns) || patterns.length === 0) {
                throw new Error('At least one pattern is required');
            }

            const matchSNL = this.snl.matchTagsSNL(database, patterns);
            const response = await this.sender.executeSNL(matchSNL, token);

            return this.snl.parseMatchTags(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to match tags: ${error.message}`);
        }
    }

    /**
     * View tag content
     */
    async viewTag(tag, database = null, token) {
        try {
            this.snl.validateTagName(tag);

            const viewSNL = this.snl.viewTagSNL(tag, database);
            const response = await this.sender.executeSNL(viewSNL, token);

            return this.snl.parseTagView(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to view tag: ${error.message}`);
        }
    }

    /**
     * Check if user can modify tag on entity
     */
    async canModifyTag(database, namespace, userEmail, permissions) {
        try {
            // Check if it's user's own data
            const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
            if (database === 'user-data' && namespace === userDataNamespace) {
                return true;
            }

            // Check permissions for other databases
            const permission = permissions.find(p => p.database === database);
            return permission && permission.level >= 2; // write permission

        } catch (error) {
            return false;
        }
    }
}

module.exports = TagManager;