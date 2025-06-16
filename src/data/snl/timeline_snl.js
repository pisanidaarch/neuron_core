// src/data/snl/timeline_snl.js

/**
 * TimelineSNL - SNL commands for Timeline entity operations
 */
class TimelineSNL {
    constructor() {
        // Timeline is stored in timeline database with user email as namespace
    }

    /**
     * Add timeline entry SNL
     * @param {string} database - Database name (timeline)
     * @param {string} namespace - User namespace (email formatted)
     * @param {string} storageKey - Storage key (date_id format)
     * @param {Object} entryData - Timeline entry data
     * @returns {string}
     */
    addTimelineEntrySNL(database, namespace, storageKey, entryData) {
        return `set(structure)\nvalues("${storageKey}", ${JSON.stringify(entryData)})\non(${database}.${namespace}.entries)`;
    }

    /**
     * Get user timeline SNL (all entries)
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @returns {string}
     */
    getUserTimelineSNL(database, namespace) {
        return `list(structure)\nvalues("*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Get timeline by year SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {number} year - Year
     * @returns {string}
     */
    getTimelineByYearSNL(database, namespace, year) {
        return `list(structure)\nvalues("${year}_*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Get timeline by month SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {number} year - Year
     * @param {number} month - Month
     * @returns {string}
     */
    getTimelineByMonthSNL(database, namespace, year, month) {
        const monthStr = month.toString().padStart(2, '0');
        return `list(structure)\nvalues("${year}_${monthStr}_*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Get timeline by day SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {number} year - Year
     * @param {number} month - Month
     * @param {number} day - Day
     * @returns {string}
     */
    getTimelineByDateSNL(database, namespace, year, month, day) {
        const monthStr = month.toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        return `list(structure)\nvalues("${year}_${monthStr}_${dayStr}_*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Get specific timeline entry SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} entryId - Timeline entry ID
     * @returns {string}
     */
    getTimelineEntrySNL(database, namespace, entryId) {
        return `view(structure)\nvalues("*${entryId}*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Search timeline SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchTimelineSNL(database, namespace, searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Delete timeline entry SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} storageKey - Storage key
     * @returns {string}
     */
    deleteTimelineEntrySNL(database, namespace, storageKey) {
        return `remove(structure)\nvalues("${storageKey}")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Update timeline entry SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} storageKey - Storage key
     * @param {Object} entryData - Updated timeline entry data
     * @returns {string}
     */
    updateTimelineEntrySNL(database, namespace, storageKey, entryData) {
        return `set(structure)\nvalues("${storageKey}", ${JSON.stringify(entryData)})\non(${database}.${namespace}.entries)`;
    }

    /**
     * Create user timeline namespace SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @returns {string}
     */
    createUserTimelineNamespaceSNL(database, namespace) {
        return `set(structure)\nvalues("entries", {})\non(${database}.${namespace}.entries)`;
    }

    /**
     * Check if user timeline namespace exists SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @returns {string}
     */
    checkUserTimelineNamespaceSNL(database, namespace) {
        return `list(structure)\nvalues("entries")\non(${database}.${namespace})`;
    }

    /**
     * Get timeline summary by date range SNL
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} startDate - Start date (YYYY_MM_DD format)
     * @param {string} endDate - End date (YYYY_MM_DD format)
     * @returns {string}
     */
    getTimelineByDateRangeSNL(database, namespace, startDate, endDate) {
        return `list(structure)\nvalues("*")\non(${database}.${namespace}.entries)`;
    }

    /**
     * Parse timeline response
     * @param {Object} response - SNL response
     * @returns {Object} Parsed timeline data
     */
    parseTimelineResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        // Return all timeline entries
        return response;
    }

    /**
     * Parse timeline entry response
     * @param {Object} response - SNL response
     * @returns {Object} Parsed timeline entry data
     */
    parseTimelineEntryResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Return the first entry found
        for (const [key, value] of Object.entries(response)) {
            if (typeof value === 'object' && value !== null) {
                return value;
            }
        }

        return null;
    }

    /**
     * Parse timeline list response
     * @param {Object} response - SNL response
     * @returns {Array<string>} Timeline entry keys
     */
    parseTimelineListResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.keys(response);
    }

    /**
     * Build timeline storage key
     * @param {Timeline} timelineEntry - Timeline entry
     * @returns {string} Storage key
     */
    buildTimelineStorageKey(timelineEntry) {
        const year = timelineEntry.year;
        const month = timelineEntry.month.toString().padStart(2, '0');
        const day = timelineEntry.day.toString().padStart(2, '0');
        const hour = timelineEntry.hour.toString().padStart(2, '0');
        const minute = timelineEntry.minute.toString().padStart(2, '0');

        return `${year}_${month}_${day}_${hour}${minute}_${timelineEntry.id}`;
    }

    /**
     * Parse storage key to get date components
     * @param {string} storageKey - Storage key
     * @returns {Object} Date components
     */
    parseStorageKey(storageKey) {
        const parts = storageKey.split('_');
        if (parts.length >= 5) {
            return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]),
                day: parseInt(parts[2]),
                hour: parseInt(parts[3].substring(0, 2)),
                minute: parseInt(parts[3].substring(2, 4)),
                id: parts.slice(4).join('_')
            };
        }
        return null;
    }

    /**
     * Validate timeline namespace
     * @param {string} namespace - Namespace to validate
     * @throws {Error} If namespace is invalid
     */
    validateTimelineNamespace(namespace) {
        if (!namespace || typeof namespace !== 'string') {
            throw new Error('Timeline namespace must be a non-empty string');
        }

        if (namespace.length > 100) {
            throw new Error('Timeline namespace must be 100 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore)
        const validNamespacePattern = /^[a-zA-Z0-9_]+$/;
        if (!validNamespacePattern.test(namespace)) {
            throw new Error('Timeline namespace can only contain letters, numbers, and underscores');
        }
    }

    /**
     * Format user email to valid namespace
     * @param {string} email - User email
     * @returns {string} Valid namespace
     */
    formatEmailToNamespace(email) {
        if (!email || typeof email !== 'string') {
            throw new Error('Email is required for timeline namespace');
        }

        // Replace special characters with underscores
        return email.replace(/[@.]/g, '_').toLowerCase();
    }

    /**
     * Get timeline search patterns for different search types
     * @param {string} searchType - Type of search (text, date, category, status)
     * @param {string} searchValue - Search value
     * @returns {string} Search pattern
     */
    getSearchPattern(searchType, searchValue) {
        switch (searchType) {
            case 'date':
                return `*${searchValue}*`;
            case 'category':
                return `*"category":"${searchValue}"*`;
            case 'status':
                return `*"status":"${searchValue}"*`;
            case 'action':
                return `*"action":"*${searchValue}*"*`;
            case 'text':
            default:
                return `*${searchValue}*`;
        }
    }

    /**
     * Build timeline aggregation SNL for statistics
     * @param {string} database - Database name
     * @param {string} namespace - User namespace
     * @param {string} aggregationType - Type of aggregation (count, sum, avg)
     * @param {string} field - Field to aggregate
     * @returns {string}
     */
    buildAggregationSNL(database, namespace, aggregationType, field) {
        // This would require special SNL commands for aggregation
        // For now, we'll use list and process in JavaScript
        return this.getUserTimelineSNL(database, namespace);
    }
}

module.exports = TimelineSNL;