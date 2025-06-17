// src/data/manager/timeline_manager.js

const BaseManager = require('./base_manager');
const TimelineSNL = require('../snl/timeline_snl');
const TimelineEntry = require('../../cross/entity/timeline_entry');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * Timeline Manager - Manages timeline operations
 * Implements the flow: entity => manager => snl => sender => manager => entity
 */
class TimelineManager extends BaseManager {
    constructor() {
        super();
        this.snl = new TimelineSNL();
    }

    /**
     * Record timeline entry
     * @param {TimelineEntry} entryEntity - Timeline entry entity
     * @param {string} token - Authentication token
     * @returns {TimelineEntry} Created timeline entry
     */
    async recordEntry(entryEntity, token) {
        this.validateInitialized();

        try {
            // Validate entity
            this.validateEntity(entryEntity);

            // Ensure entry ID
            if (!entryEntity.id) {
                entryEntity.id = this.snl.generateEntryId();
            }

            // Transform entity for storage
            const entryData = this.transformForStorage(entryEntity);

            // Generate SNL command
            const snlCommand = this.snl.setTimelineEntrySNL(
                entryEntity.userEmail,
                entryEntity.id,
                entryData
            );

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('recordTimelineEntry', {
                userEmail: entryEntity.userEmail,
                type: entryEntity.type,
                id: entryEntity.id
            });

            // Update summary in background
            this._updateSummaryAsync(entryEntity.userEmail, token);

            // Return created entry
            return entryEntity;

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get timeline entry
     * @param {string} userEmail - User email
     * @param {string} entryId - Entry ID
     * @param {string} token - Authentication token
     * @returns {TimelineEntry} Timeline entry
     */
    async getEntry(userEmail, entryId, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.getTimelineEntrySNL(userEmail, entryId);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            if (!response || Object.keys(response).length === 0) {
                throw new NotFoundError(`Timeline entry not found: ${entryId}`);
            }

            // Parse response
            const entryData = this.snl.parseTimelineEntry(response);

            // Transform to entity
            return this.transformToEntity({
                ...entryData,
                userEmail
            });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * List timeline entries
     * @param {string} userEmail - User email
     * @param {Object} options - List options
     * @param {string} token - Authentication token
     * @returns {TimelineEntry[]} Array of timeline entries
     */
    async listEntries(userEmail, options = {}, token) {
        this.validateInitialized();

        try {
            const {
                pattern = '*',
                limit = 100,
                offset = 0,
                type = null,
                startDate = null,
                endDate = null
            } = options;

            // Generate SNL command
            const snlCommand = this.snl.listTimelineEntriesSNL(userEmail, pattern);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            let entries = this.snl.parseTimelineList(response);

            // Apply filters
            if (type) {
                entries = entries.filter(entry => entry.type === type);
            }

            if (startDate) {
                const start = new Date(startDate);
                entries = entries.filter(entry => new Date(entry.timestamp) >= start);
            }

            if (endDate) {
                const end = new Date(endDate);
                entries = entries.filter(entry => new Date(entry.timestamp) <= end);
            }

            // Apply pagination
            entries = entries.slice(offset, offset + limit);

            // Transform each to entity
            return entries.map(entryData => this.transformToEntity({
                ...entryData,
                userEmail
            }));

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Search timeline entries
     * @param {string} userEmail - User email
     * @param {string} searchTerm - Search term
     * @param {string} token - Authentication token
     * @returns {TimelineEntry[]} Matching entries
     */
    async searchEntries(userEmail, searchTerm, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.searchTimelineEntriesSNL(userEmail, searchTerm);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            // Parse response
            const entries = this.snl.parseTimelineList(response);

            // Transform each to entity
            return entries.map(entryData => this.transformToEntity({
                ...entryData,
                userEmail
            }));

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete timeline entry
     * @param {string} userEmail - User email
     * @param {string} entryId - Entry ID
     * @param {string} token - Authentication token
     */
    async deleteEntry(userEmail, entryId, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.removeTimelineEntrySNL(userEmail, entryId);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('deleteTimelineEntry', { userEmail, entryId });

            // Update summary in background
            this._updateSummaryAsync(userEmail, token);

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Tag timeline entry
     * @param {string} userEmail - User email
     * @param {string} entryId - Entry ID
     * @param {string} tag - Tag to add
     * @param {string} token - Authentication token
     */
    async tagEntry(userEmail, entryId, tag, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.tagTimelineEntrySNL(userEmail, entryId, tag);

            // Execute SNL via sender
            await this.executeSNL(snlCommand, token);

            // Log operation
            this.logOperation('tagTimelineEntry', { userEmail, entryId, tag });

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get timeline summary
     * @param {string} userEmail - User email
     * @param {string} token - Authentication token
     * @returns {Object} Timeline summary
     */
    async getSummary(userEmail, token) {
        this.validateInitialized();

        try {
            // Generate SNL command
            const snlCommand = this.snl.getTimelineSummarySNL(userEmail);

            // Execute SNL via sender
            const response = await this.executeSNL(snlCommand, token);

            if (!response || Object.keys(response).length === 0) {
                // No summary yet, return default
                return {
                    totalEntries: 0,
                    entriesByType: {},
                    lastActivity: null,
                    firstActivity: null,
                    updatedAt: new Date().toISOString()
                };
            }

            // Parse and return summary
            const summaryData = Object.values(response)[0];
            return summaryData;

        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update timeline summary (async)
     * @private
     */
    async _updateSummaryAsync(userEmail, token) {
        try {
            // Get all entries
            const entries = await this.listEntries(userEmail, { limit: 1000 }, token);

            // Create summary
            const summary = this.snl.createTimelineSummary(
                entries.map(e => e.toJSON())
            );

            // Store summary
            const summarySNL = this.snl.setTimelineSummarySNL(userEmail, summary);
            await this.executeSNL(summarySNL, token);

        } catch (error) {
            // Log error but don't throw - this is background operation
            console.error('Failed to update timeline summary:', error);
        }
    }

    /**
     * Validate entity
     * @param {TimelineEntry} entity - Timeline entry entity to validate
     */
    validateEntity(entity) {
        if (!entity || !(entity instanceof TimelineEntry)) {
            throw new ValidationError('Invalid timeline entry entity');
        }

        const errors = entity.validate();
        if (errors.length > 0) {
            throw new ValidationError(`Timeline entry validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Transform timeline entry entity for storage
     * @param {TimelineEntry} entity - Timeline entry entity
     * @returns {Object} Data for storage
     */
    transformForStorage(entity) {
        const data = entity.toJSON();

        // Remove userEmail and id from data (they're used as keys)
        delete data.userEmail;
        delete data.id;

        return data;
    }

    /**
     * Transform response data to timeline entry entity
     * @param {Object} data - Response data
     * @returns {TimelineEntry} Timeline entry entity
     */
    transformToEntity(data) {
        return new TimelineEntry(data);
    }

    /**
     * Get entries by type
     * @param {string} userEmail - User email
     * @param {string} type - Entry type
     * @param {string} token - Authentication token
     * @returns {TimelineEntry[]} Entries of specified type
     */
    async getEntriesByType(userEmail, type, token) {
        return await this.listEntries(userEmail, { type }, token);
    }

    /**
     * Get recent entries
     * @param {string} userEmail - User email
     * @param {number} days - Number of days back
     * @param {string} token - Authentication token
     * @returns {TimelineEntry[]} Recent entries
     */
    async getRecentEntries(userEmail, days = 7, token) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await this.listEntries(userEmail, {
            startDate: startDate.toISOString()
        }, token);
    }
}

module.exports = TimelineManager;