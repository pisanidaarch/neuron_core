// src/api/support/controllers/timeline_controller.js

const TimelineEntry = require('../../../cross/entity/timeline_entry');
const TimelineManager = require('../../../data/manager/timeline_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const KeysVO = require('../../../cross/entity/keys_vo');
const AuthMiddleware = require('../../security/middleware/auth_middleware');

/**
 * TimelineController - Handles timeline operations
 */
class TimelineController {
    constructor() {
        this.timelineManager = new TimelineManager();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * Get timeline entries by period
     */
    async getTimelineByPeriod(req, res) {
        try {
            const { ai_name } = req.params;
            const { year, month, day, entity } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.timelineManager.initialize(aiSender);

            const entityName = entity || 'general';
            const entries = await this.timelineManager.getEntriesByPeriod(
                userInfo.email,
                entityName,
                parseInt(year),
                month ? parseInt(month) : null,
                day ? parseInt(day) : null,
                token
            );

            res.json({
                success: true,
                data: entries,
                count: entries.length
            });

        } catch (error) {
            console.error('Error getting timeline:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Search timeline entries
     */
    async searchTimeline(req, res) {
        try {
            const { ai_name } = req.params;
            const { query } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.timelineManager.initialize(aiSender);

            const entries = await this.timelineManager.searchEntries(
                userInfo.email,
                query,
                token
            );

            res.json({
                success: true,
                data: entries,
                count: entries.length
            });

        } catch (error) {
            console.error('Error searching timeline:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Add tag to timeline entry
     */
    async addTagToEntry(req, res) {
        try {
            const { ai_name } = req.params;
            const { entryId, tag, entity } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!entryId || !tag) {
                return res.status(400).json({ error: 'Entry ID and tag are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.timelineManager.initialize(aiSender);

            const entityName = entity || 'general';
            const success = await this.timelineManager.addTagToEntry(
                userInfo.email,
                entityName,
                entryId,
                tag,
                token
            );

            res.json({
                success,
                message: success ? 'Tag added successfully' : 'Failed to add tag'
            });

        } catch (error) {
            console.error('Error adding tag to timeline entry:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Record new timeline entry
     */
    async recordEntry(req, res) {
        try {
            const { ai_name } = req.params;
            const entryData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Create timeline entry
            const entry = new TimelineEntry({
                ...entryData,
                user_email: userInfo.email,
                ai_name: ai_name
            });

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.timelineManager.initialize(aiSender);

            const savedEntry = await this.timelineManager.storeEntry(entry, token);

            res.json({
                success: true,
                data: savedEntry,
                message: 'Timeline entry recorded successfully'
            });

        } catch (error) {
            console.error('Error recording timeline entry:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TimelineController;