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