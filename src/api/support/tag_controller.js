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