// src/data/manager/timeline_manager.js

const Timeline = require('../../cross/entity/timeline');
const TimelineSNL = require('../snl/timeline_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * TimelineManager - Manages Timeline entity operations
 */
class TimelineManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new TimelineSNL();
        this.sender = new AISender();
        this.database = 'timeline';
    }

    /**
     * Initialize timeline structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Timeline database should be created during system initialization
            // Here we just ensure the database exists
            console.log('✅ Timeline manager initialized');
        } catch (error) {
            console.error('Failed to initialize timeline:', error);
            throw error;
        }
    }

    /**
     * Add timeline entry
     * @param {Timeline} timelineEntry - Timeline entity
     * @returns {Promise<Timeline>}
     */
    async addTimelineEntry(timelineEntry) {
        try {
            const validation = timelineEntry.validate();
            if (!validation.valid) {
                throw new ValidationError(`Timeline entry validation failed: ${validation.errors.join(', ')}`);
            }

            const namespace = timelineEntry.getNamespace();
            const storageKey = timelineEntry.getStorageKey();
            const entryData = timelineEntry.toObject();

            const snlCommand = this.snl.addTimelineEntrySNL(
                this.database,
                namespace,
                storageKey,
                entryData
            );
            await this.sender.executeSNL(snlCommand, this.aiToken);

            console.log(`✅ Timeline entry added: ${timelineEntry.id}`);
            return timelineEntry;
        } catch (error) {
            console.error('Failed to add timeline entry:', error);
            throw error;
        }
    }

    /**
     * Get user timeline with filters
     * @param {string} userEmail - User email
     * @param {Object} options - Filter options
     * @returns {Promise<Timeline[]>}
     */
    async getUserTimeline(userEmail, options = {}) {
        try {
            const namespace = userEmail.replace(/[@.]/g, '_');
            const { year, month, day, page = 1, limit = 50, category, status } = options;

            let snlCommand;
            if (year && month && day) {
                // Get specific day
                snlCommand = this.snl.getTimelineByDateSNL(this.database, namespace, year, month, day);
            } else if (year && month) {
                // Get specific month
                snlCommand = this.snl.getTimelineByMonthSNL(this.database, namespace, year, month);
            } else if (year) {
                // Get specific year
                snlCommand = this.snl.getTimelineByYearSNL(this.database, namespace, year);
            } else {
                // Get all timeline
                snlCommand = this.snl.getUserTimelineSNL(this.database, namespace);
            }

            const response = await this.sender.executeSNL(snlCommand, this.aiToken);
            const timelineData = this.snl.parseTimelineResponse(response);

            const timelineEntries = [];
            for (const [key, data] of Object.entries(timelineData)) {
                if (data && typeof data === 'object') {
                    const entry = Timeline.fromObject(data);

                    // Apply filters
                    if (category && entry.category !== category) continue;
                    if (status && entry.status !== status) continue;

                    timelineEntries.push(entry);
                }
            }

            // Sort by creation date (newest first)
            timelineEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return timelineEntries.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to get user timeline:', error);
            throw error;
        }
    }

    /**
     * Search user timeline
     * @param {string} userEmail - User email
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Promise<Timeline[]>}
     */
    async searchUserTimeline(userEmail, searchTerm, filters = {}) {
        try {
            const namespace = userEmail.replace(/[@.]/g, '_');
            const snlCommand = this.snl.searchTimelineSNL(this.database, namespace, searchTerm);
            const response = await this.sender.executeSNL(snlCommand, this.aiToken);

            const timelineData = this.snl.parseTimelineResponse(response);
            const timelineEntries = [];

            for (const [key, data] of Object.entries(timelineData)) {
                if (data && typeof data === 'object') {
                    const entry = Timeline.fromObject(data);

                    // Apply filters
                    if (filters.category && entry.category !== filters.category) continue;
                    if (filters.status && entry.status !== filters.status) continue;
                    if (filters.startDate && new Date(entry.createdAt) < new Date(filters.startDate)) continue;
                    if (filters.endDate && new Date(entry.createdAt) > new Date(filters.endDate)) continue;

                    timelineEntries.push(entry);
                }
            }

            // Sort by relevance and date
            timelineEntries.sort((a, b) => {
                // First sort by relevance (simple text matching)
                const aRelevance = this.calculateSearchRelevance(a, searchTerm);
                const bRelevance = this.calculateSearchRelevance(b, searchTerm);

                if (aRelevance !== bRelevance) {
                    return bRelevance - aRelevance;
                }

                // Then by date (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Apply pagination
            const { page = 1, limit = 50 } = filters;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return timelineEntries.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to search user timeline:', error);
            throw error;
        }
    }

    /**
     * Get timeline entry by ID
     * @param {string} userEmail - User email
     * @param {string} entryId - Timeline entry ID
     * @returns {Promise<Timeline|null>}
     */
    async getTimelineEntry(userEmail, entryId) {
        try {
            const namespace = userEmail.replace(/[@.]/g, '_');
            const snlCommand = this.snl.getTimelineEntrySNL(this.database, namespace, entryId);
            const response = await this.sender.executeSNL(snlCommand, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const entryData = this.snl.parseTimelineEntryResponse(response);
            return Timeline.fromObject(entryData);
        } catch (error) {
            console.error('Failed to get timeline entry:', error);
            throw error;
        }
    }

    /**
     * Delete timeline entry
     * @param {string} userEmail - User email
     * @param {string} entryId - Timeline entry ID
     * @returns {Promise<boolean>}
     */
    async deleteTimelineEntry(userEmail, entryId) {
        try {
            const namespace = userEmail.replace(/[@.]/g, '_');

            // Check if entry exists first
            const existingEntry = await this.getTimelineEntry(userEmail, entryId);
            if (!existingEntry) {
                throw new NotFoundError(`Timeline entry not found: ${entryId}`);
            }

            const storageKey = existingEntry.getStorageKey();
            const snlCommand = this.snl.deleteTimelineEntrySNL(this.database, namespace, storageKey);
            await this.sender.executeSNL(snlCommand, this.aiToken);

            console.log(`✅ Timeline entry deleted: ${entryId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete timeline entry:', error);
            throw error;
        }
    }

    /**
     * Get user timeline statistics
     * @param {string} userEmail - User email
     * @param {Object} options - Options for statistics
     * @returns {Promise<Object>}
     */
    async getUserTimelineStatistics(userEmail, options = {}) {
        try {
            const { year, month } = options;
            const timelineEntries = await this.getUserTimeline(userEmail, {
                year,
                month,
                limit: 10000 // Get all entries for statistics
            });

            const stats = {
                total: timelineEntries.length,
                byCategory: {},
                byStatus: {},
                byMonth: {},
                byDay: {},
                averageDuration: 0,
                totalDuration: 0,
                successRate: 0,
                mostActiveDay: null,
                mostActiveHour: null
            };

            let totalDuration = 0;
            let successCount = 0;
            const hourCounts = {};
            const dayCounts = {};

            timelineEntries.forEach(entry => {
                // Count by category
                stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;

                // Count by status
                stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1;

                // Count by month
                const monthKey = `${entry.year}-${entry.month.toString().padStart(2, '0')}`;
                stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

                // Count by day
                const dayKey = `${entry.year}-${entry.month.toString().padStart(2, '0')}-${entry.day.toString().padStart(2, '0')}`;
                stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;

                // Count by hour
                hourCounts[entry.hour] = (hourCounts[entry.hour] || 0) + 1;

                // Calculate duration and success
                totalDuration += entry.duration || 0;
                if (entry.status === 'success') {
                    successCount++;
                }
            });

            // Calculate averages and most active times
            stats.totalDuration = totalDuration;
            stats.averageDuration = timelineEntries.length > 0 ? Math.round(totalDuration / timelineEntries.length) : 0;
            stats.successRate = timelineEntries.length > 0 ? Math.round((successCount / timelineEntries.length) * 100) : 0;

            // Find most active hour
            let maxHourCount = 0;
            for (const [hour, count] of Object.entries(hourCounts)) {
                if (count > maxHourCount) {
                    maxHourCount = count;
                    stats.mostActiveHour = parseInt(hour);
                }
            }

            // Find most active day
            let maxDayCount = 0;
            for (const [day, count] of Object.entries(stats.byDay)) {
                if (count > maxDayCount) {
                    maxDayCount = count;
                    stats.mostActiveDay = day;
                }
            }

            return stats;
        } catch (error) {
            console.error('Failed to get timeline statistics:', error);
            throw error;
        }
    }

    /**
     * Clean old timeline entries
     * @param {string} userEmail - User email
     * @param {number} daysToKeep - Number of days to keep
     * @returns {Promise<number>}
     */
    async cleanOldEntries(userEmail, daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const timelineEntries = await this.getUserTimeline(userEmail, { limit: 10000 });
            let deletedCount = 0;

            for (const entry of timelineEntries) {
                if (new Date(entry.createdAt) < cutoffDate && !entry.isSystemGenerated) {
                    await this.deleteTimelineEntry(userEmail, entry.id);
                    deletedCount++;
                }
            }

            console.log(`✅ Cleaned ${deletedCount} old timeline entries for user: ${userEmail}`);
            return deletedCount;
        } catch (error) {
            console.error('Failed to clean old timeline entries:', error);
            throw error;
        }
    }

    /**
     * Calculate search relevance score
     * @param {Timeline} entry - Timeline entry
     * @param {string} searchTerm - Search term
     * @returns {number} Relevance score
     */
    calculateSearchRelevance(entry, searchTerm) {
        let score = 0;
        const term = searchTerm.toLowerCase();

        // Check action
        if (entry.action.toLowerCase().includes(term)) score += 3;

        // Check summaries
        if (entry.inputSummary && entry.inputSummary.toLowerCase().includes(term)) score += 2;
        if (entry.outputSummary && entry.outputSummary.toLowerCase().includes(term)) score += 2;

        // Check tags
        if (entry.tags.some(tag => tag.toLowerCase().includes(term))) score += 2;

        // Check category
        if (entry.category.toLowerCase().includes(term)) score += 1;

        // Check error message
        if (entry.errorMessage && entry.errorMessage.toLowerCase().includes(term)) score += 1;

        return score;
    }

    /**
     * Create timeline entry for AI interaction
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} action - Action performed
     * @param {Object} inputData - Input data
     * @param {Object} outputData - Output data
     * @param {number} duration - Duration in milliseconds
     * @returns {Promise<Timeline>}
     */
    async logAIInteraction(userEmail, aiName, action, inputData, outputData, duration = 0) {
        try {
            const timelineEntry = Timeline.createAIInteraction(
                userEmail.split('@')[0], // userId from email
                userEmail,
                aiName,
                action,
                inputData,
                outputData
            );

            timelineEntry.setSuccess(duration);

            return await this.addTimelineEntry(timelineEntry);
        } catch (error) {
            console.error('Failed to log AI interaction:', error);
            throw error;
        }
    }

    /**
     * Create timeline entry for security action
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} action - Security action
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Timeline>}
     */
    async logSecurityAction(userEmail, aiName, action, metadata = {}) {
        try {
            const timelineEntry = Timeline.createSecurityAction(
                userEmail.split('@')[0], // userId from email
                userEmail,
                aiName,
                action,
                metadata
            );

            return await this.addTimelineEntry(timelineEntry);
        } catch (error) {
            console.error('Failed to log security action:', error);
            throw error;
        }
    }
}

module.exports = TimelineManager;