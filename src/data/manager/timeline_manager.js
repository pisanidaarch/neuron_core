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
