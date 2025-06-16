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

