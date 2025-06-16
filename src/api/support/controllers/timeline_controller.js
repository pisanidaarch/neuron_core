// src/api/support/controllers/timeline_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const TimelineManager = require('../../../data/manager/timeline_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const Timeline = require('../../../cross/entity/timeline');
const { AuthenticationError, ValidationError } = require('../../../cross/entity/errors');

/**
 * Timeline Controller for NeuronCore Support API
 */
class TimelineController {
    constructor() {
        this.sender = new AISender();
    }

    /**
     * Get AI token for operations
     * @param {string} aiName - AI name
     * @returns {Promise<string>}
     */
    async getAIToken(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        return keysVO.getAIToken(aiName);
    }

    /**
     * Validate user token and get user info
     * @param {string} token - JWT token
     * @returns {Promise<Object>}
     */
    async validateUserToken(token) {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        return await this.sender.validateToken(token);
    }

    /**
     * Get timeline endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getTimeline(req, res) {
        try {
            const { aiName } = req.params;
            const {
                year,
                month,
                day,
                page = 1,
                limit = 50,
                category,
                status,
                startDate,
                endDate
            } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and get user info
            const userInfo = await this.validateUserToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create timeline manager
            const timelineManager = new TimelineManager(aiToken);

            // Build filter options
            const filterOptions = {
                year: year ? parseInt(year) : undefined,
                month: month ? parseInt(month) : undefined,
                day: day ? parseInt(day) : undefined,
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                status,
                startDate,
                endDate
            };

            // Get user's timeline
            const timelineEntries = await timelineManager.getUserTimeline(
                userInfo.email,
                filterOptions
            );

            // Format response
            const formattedEntries = timelineEntries.map(entry => ({
                ...entry.toObject(),
                formattedDuration: Timeline.formatDuration(entry.duration),
                relativeTime: this.getRelativeTime(entry.createdAt)
            }));

            res.json({
                error: false,
                data: {
                    entries: formattedEntries,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: formattedEntries.length
                    },
                    filters: filterOptions,
                    userEmail: userInfo.email
                }
            });

        } catch (error) {
            console.error('Get timeline error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get timeline'
                });
            }
        }
    }

    /**
     * Search timeline endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async searchTimeline(req, res) {
        try {
            const { aiName } = req.params;
            const {
                query,
                category,
                status,
                startDate,
                endDate,
                page = 1,
                limit = 50
            } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and get user info
            const userInfo = await this.validateUserToken(token);

            if (!query || typeof query !== 'string') {
                throw new ValidationError('Search query is required');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create timeline manager
            const timelineManager = new TimelineManager(aiToken);

            // Search timeline
            const searchResults = await timelineManager.searchUserTimeline(
                userInfo.email,
                query,
                {
                    category,
                    status,
                    startDate,
                    endDate,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            );

            // Format response
            const formattedResults = searchResults.map(entry => ({
                ...entry.toObject(),
                formattedDuration: Timeline.formatDuration(entry.duration),
                relativeTime: this.getRelativeTime(entry.createdAt),
                relevanceScore: this.calculateRelevanceScore(entry, query)
            }));

            res.json({
                error: false,
                data: {
                    query: query,
                    results: formattedResults,
                    count: formattedResults.length,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit)
                    },
                    userEmail: userInfo.email
                }
            });

        } catch (error) {
            console.error('Search timeline error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to search timeline'
                });
            }
        }
    }

    /**
     * Get timeline statistics endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getTimelineStatistics(req, res) {
        try {
            const { aiName } = req.params;
            const { year, month } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and get user info
            const userInfo = await this.validateUserToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create timeline manager
            const timelineManager = new TimelineManager(aiToken);

            // Get statistics
            const stats = await timelineManager.getUserTimelineStatistics(
                userInfo.email,
                {
                    year: year ? parseInt(year) : undefined,
                    month: month ? parseInt(month) : undefined
                }
            );

            res.json({
                error: false,
                data: {
                    statistics: stats,
                    period: {
                        year: year ? parseInt(year) : new Date().getFullYear(),
                        month: month ? parseInt(month) : undefined
                    },
                    userEmail: userInfo.email
                }
            });

        } catch (error) {
            console.error('Get timeline statistics error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get timeline statistics'
                });
            }
        }
    }

    /**
     * Add timeline entry endpoint (for manual entries)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async addTimelineEntry(req, res) {
        try {
            const { aiName } = req.params;
            const entryData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and get user info
            const userInfo = await this.validateUserToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create timeline entry
            const timelineEntry = new Timeline({
                ...entryData,
                userId: userInfo.username,
                userEmail: userInfo.email,
                aiName: aiName
            });

            // Validate timeline entry
            const validation = timelineEntry.validate();
            if (!validation.valid) {
                throw new ValidationError(`Timeline entry validation failed: ${validation.errors.join(', ')}`);
            }

            // Save timeline entry
            const timelineManager = new TimelineManager(aiToken);
            const savedEntry = await timelineManager.addTimelineEntry(timelineEntry);

            res.status(201).json({
                error: false,
                message: 'Timeline entry added successfully',
                data: {
                    ...savedEntry.toObject(),
                    formattedDuration: Timeline.formatDuration(savedEntry.duration),
                    relativeTime: this.getRelativeTime(savedEntry.createdAt)
                }
            });

        } catch (error) {
            console.error('Add timeline entry error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to add timeline entry'
                });
            }
        }
    }

    /**
     * Get relative time string
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Relative time
     */
    getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) {
            return 'agora mesmo';
        } else if (diffMinutes < 60) {
            return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        } else {
            return time.toLocaleDateString('pt-BR');
        }
    }

    /**
     * Calculate relevance score for search results
     * @param {Timeline} entry - Timeline entry
     * @param {string} query - Search query
     * @returns {number} Relevance score (0-100)
     */
    calculateRelevanceScore(entry, query) {
        let score = 0;
        const queryLower = query.toLowerCase();

        // Check action
        if (entry.action.toLowerCase().includes(queryLower)) {
            score += 30;
        }

        // Check input summary
        if (entry.inputSummary && entry.inputSummary.toLowerCase().includes(queryLower)) {
            score += 25;
        }

        // Check output summary
        if (entry.outputSummary && entry.outputSummary.toLowerCase().includes(queryLower)) {
            score += 25;
        }

        // Check tags
        if (entry.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 15;
        }

        // Check category
        if (entry.category.toLowerCase().includes(queryLower)) {
            score += 5;
        }

        return Math.min(score, 100);
    }
}

module.exports = TimelineController;