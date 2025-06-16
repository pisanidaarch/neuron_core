// src/api/support/command_controller.js

const CommandService = require('../../core/support/command_service');
const { AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Command Controller - HTTP layer for command operations
 */
class CommandController {
    constructor(aiName) {
        this.service = new CommandService(aiName);
    }

    /**
     * Create new command
     */
    async createCommand(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.createCommand(
                body,
                user.permissions,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Command created successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get command by ID
     */
    async getCommand(req, res) {
        try {
            const { params, query, user, token } = this._extractRequestData(req);
            const { id } = params;
            const { database, namespace } = query;

            const searchLocation = database && namespace ? [{ database, namespace }] : null;

            const result = await this.service.getCommand(
                id,
                searchLocation,
                user.permissions,
                user.email,
                token
            );

            if (!result) {
                return res.status(404).json({
                    error: true,
                    message: 'Command not found'
                });
            }

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Update command
     */
    async updateCommand(req, res) {
        try {
            const { params, body, query, user, token } = this._extractRequestData(req);
            const { id } = params;
            const { database, namespace } = query;

            const searchLocation = database && namespace ? [{ database, namespace }] : null;

            const result = await this.service.updateCommand(
                id,
                body,
                searchLocation,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Command updated successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Delete command
     */
    async deleteCommand(req, res) {
        try {
            const { params, query, user, token } = this._extractRequestData(req);
            const { id } = params;
            const { database, namespace } = query;

            const searchLocation = database && namespace ? [{ database, namespace }] : null;

            const result = await this.service.deleteCommand(
                id,
                searchLocation,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Command deleted successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * List commands
     */
    async listCommands(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { database, namespace, pattern } = query;

            const location = database && namespace ? { database, namespace } : null;

            const result = await this.service.listCommands(
                location,
                pattern,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Search commands
     */
    async searchCommands(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { q: searchTerm, databases } = query;

            if (!searchTerm) {
                return res.status(400).json({
                    error: true,
                    message: 'Search term is required'
                });
            }

            const searchLocations = databases ? databases.split(',').map(db => ({ database: db, namespace: '*' })) : null;

            const result = await this.service.searchCommands(
                searchTerm,
                searchLocations,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        // Assuming user data is attached by auth middleware
        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Command Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = CommandController;

// src/api/support/timeline_controller.js

const TimelineService = require('../../core/support/timeline_service');
const { AuthenticationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Timeline Controller - HTTP layer for timeline operations
 */
class TimelineController {
    constructor(aiName) {
        this.service = new TimelineService(aiName);
    }

    /**
     * Record new interaction
     */
    async recordInteraction(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { userInput, aiResponse, metadata } = body;

            if (!userInput && !aiResponse) {
                return res.status(400).json({
                    error: true,
                    message: 'Either user input or AI response is required'
                });
            }

            const result = await this.service.recordInteraction(
                userInput || '',
                aiResponse || '',
                user.email,
                metadata,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Timeline entry recorded successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get timeline by period
     */
    async getTimeline(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { year, month, day, hour } = query;

            if (!year) {
                return res.status(400).json({
                    error: true,
                    message: 'Year is required'
                });
            }

            const result = await this.service.getTimelineByPeriod(
                user.email,
                parseInt(year),
                month ? parseInt(month) : null,
                day ? parseInt(day) : null,
                hour ? parseInt(hour) : null,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Search timeline
     */
    async searchTimeline(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { q: searchTerm } = query;

            if (!searchTerm) {
                return res.status(400).json({
                    error: true,
                    message: 'Search term is required'
                });
            }

            const result = await this.service.searchTimeline(
                user.email,
                searchTerm,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Add tag to timeline entry
     */
    async addTagToEntry(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { entryId, tag } = body;

            if (!entryId || !tag) {
                return res.status(400).json({
                    error: true,
                    message: 'Entry ID and tag are required'
                });
            }

            const result = await this.service.addTagToEntry(
                user.email,
                entryId,
                tag,
                token
            );

            res.json({
                error: false,
                message: 'Tag added to timeline entry successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get timeline summary
     */
    async getTimelineSummary(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.getTimelineSummary(
                user.email,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get recent timeline entries
     */
    async getRecentEntries(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { limit } = query;

            const result = await this.service.getRecentEntries(
                user.email,
                limit ? parseInt(limit) : 10,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Timeline Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = TimelineController;

// src/api/support/config_controller.js

const ConfigService = require('../../core/support/config_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * Config Controller - HTTP layer for AI configuration
 */
class ConfigController {
    constructor(aiName) {
        this.service = new ConfigService(aiName);
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.getAIConfig(
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Update AI theme
     */
    async updateTheme(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.updateTheme(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'AI theme updated successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Update AI behavior
     */
    async updateBehavior(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.updateBehavior(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'AI behavior updated successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.getBehaviorOverride(
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.setBehaviorOverride(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Behavior override set successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Reset to default configuration
     */
    async resetToDefault(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.resetToDefault(
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Configuration reset to default successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Config Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = ConfigController;

// src/api/support/tag_controller.js

const TagService = require('../../core/support/tag_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * Tag Controller - HTTP layer for tag operations
 */
class TagController {
    constructor(aiName) {
        this.service = new TagService(aiName);
    }

    /**
     * Add tag to entity
     */
    async addTag(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { database, namespace, entity, tag } = body;

            if (!database || !namespace || !entity || !tag) {
                return res.status(400).json({
                    error: true,
                    message: 'Database, namespace, entity, and tag are required'
                });
            }

            const result = await this.service.addTag(
                database,
                namespace,
                entity,
                tag,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Tag added successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { database, namespace, entity, tag } = body;

            if (!database || !namespace || !entity || !tag) {
                return res.status(400).json({
                    error: true,
                    message: 'Database, namespace, entity, and tag are required'
                });
            }

            const result = await this.service.removeTag(
                database,
                namespace,
                entity,
                tag,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Tag removed successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * List tags
     */
    async listTags(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { database, pattern } = query;

            const result = await this.service.listTags(
                database,
                pattern || '*',
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Match tags by patterns
     */
    async matchTags(req, res) {
        try {
            const { body, query, user, token } = this._extractRequestData(req);
            const { patterns } = body;
            const { database } = query;

            if (!patterns || !Array.isArray(patterns)) {
                return res.status(400).json({
                    error: true,
                    message: 'Patterns array is required'
                });
            }

            const result = await this.service.matchTags(
                patterns,
                database,
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * View tag content
     */
    async viewTag(req, res) {
        try {
            const { params, query, user, token } = this._extractRequestData(req);
            const { tag } = params;
            const { database } = query;

            const result = await this.service.viewTag(
                tag,
                database,
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Tag Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = TagController;