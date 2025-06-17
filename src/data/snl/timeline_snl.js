// src/data/snl/timeline_snl.js

const BaseSNL = require('./base_snl');

/**
 * Timeline SNL - Generates SNL commands for timeline operations
 */
class TimelineSNL extends BaseSNL {
    constructor() {
        super();
        this.database = 'timeline';
    }

    /**
     * Store timeline entry
     */
    setTimelineEntrySNL(userEmail, entryId, entryData) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'entries');
        const values = [entryId, entryData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * Get timeline entry
     */
    getTimelineEntrySNL(userEmail, entryId) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'entries', entryId);
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * List timeline entries
     */
    listTimelineEntriesSNL(userEmail, pattern = '*') {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace);
        return this.buildSNL('list', 'structure', pattern, path);
    }

    /**
     * Search timeline entries
     */
    searchTimelineEntriesSNL(userEmail, searchTerm) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace);
        return this.buildSNL('search', 'structure', searchTerm, path);
    }

    /**
     * Remove timeline entry
     */
    removeTimelineEntrySNL(userEmail, entryId) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'entries');
        return this.buildSNL('remove', 'structure', entryId, path);
    }

    /**
     * Tag timeline entry
     */
    tagTimelineEntrySNL(userEmail, entryId, tagName) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'entries', entryId);
        return this.buildSNL('tag', 'structure', tagName, path);
    }

    /**
     * Store timeline summary
     */
    setTimelineSummarySNL(userEmail, summaryData) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'summary');
        const values = ['latest', summaryData];
        return this.buildSNL('set', 'structure', values, path);
    }

    /**
     * Get timeline summary
     */
    getTimelineSummarySNL(userEmail) {
        const namespace = this.formatEmailForNamespace(userEmail);
        const path = this.buildPath(this.database, namespace, 'summary', 'latest');
        return this.buildSNL('view', 'structure', null, path);
    }

    /**
     * Create timeline entry data
     */
    createTimelineEntry(type, content, metadata = {}) {
        return {
            type,
            content,
            metadata,
            timestamp: new Date().toISOString(),
            id: this.generateEntryId()
        };
    }

    /**
     * Generate unique entry ID
     */
    generateEntryId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${timestamp}_${random}`;
    }

    /**
     * Parse timeline entry from response
     */
    parseTimelineEntry(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const ids = Object.keys(response);
        if (ids.length === 0) {
            return null;
        }

        const entryId = ids[0];
        const entryData = response[entryId];

        return {
            id: entryId,
            ...entryData
        };
    }

    /**
     * Parse timeline entries list from response
     */
    parseTimelineList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response)
            .map(([id, entryData]) => ({
                id,
                ...entryData
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Validate timeline entry
     */
    validateTimelineEntry(entryData) {
        const required = ['type', 'content', 'timestamp'];
        const missing = required.filter(field => !entryData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required timeline fields: ${missing.join(', ')}`);
        }

        const validTypes = ['chat', 'command', 'system', 'error', 'workflow'];
        if (!validTypes.includes(entryData.type)) {
            throw new Error(`Invalid timeline entry type: ${entryData.type}`);
        }

        return true;
    }

    /**
     * Create timeline summary
     */
    createTimelineSummary(entries) {
        const summary = {
            totalEntries: entries.length,
            entriesByType: {},
            lastActivity: null,
            firstActivity: null,
            updatedAt: new Date().toISOString()
        };

        if (entries.length > 0) {
            // Count by type
            entries.forEach(entry => {
                summary.entriesByType[entry.type] = (summary.entriesByType[entry.type] || 0) + 1;
            });

            // Get date range
            const sorted = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            summary.firstActivity = sorted[0].timestamp;
            summary.lastActivity = sorted[sorted.length - 1].timestamp;
        }

        return summary;
    }
}

module.exports = TimelineSNL;