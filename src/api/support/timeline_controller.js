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