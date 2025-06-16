// src/data/snl/timeline_snl.js

/**
 * Timeline SNL - SNL operations for timeline management
 */
class TimelineSNL {
    constructor() {
        // Timeline operations
    }

    /**
     * Format email for namespace
     */
    formatEmailForNamespace(email) {
        return email.replace(/\./g, '_').replace('@', '_at_');
    }

    /**
     * Create timeline entry SNL
     */
    createTimelineEntrySNL(userEmail, entityName, entryId, entry) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `set(structure)\nvalues("${entryId}", ${JSON.stringify(entry)})\non(timeline.${namespace}.${entityName})`;
    }

    /**
     * Get timeline entries for month SNL
     */
    getTimelineEntriesSNL(userEmail, entityName) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `view(structure)\non(timeline.${namespace}.${entityName})`;
    }

    /**
     * List timeline entities (months) SNL
     */
    listTimelineEntitiesSNL(userEmail) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `list(structure)\nvalues("*")\non(timeline.${namespace})`;
    }

    /**
     * Search timeline SNL
     */
    searchTimelineSNL(userEmail, searchTerm) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `search(structure)\nvalues("${searchTerm}")\non(timeline.${namespace}.*)`;
    }

    /**
     * Add tag to timeline entry SNL
     */
    addTagToTimelineEntrySNL(userEmail, entityName, entryId, tag) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `tag(structure)\nvalues("${tag}")\non(timeline.${namespace}.${entityName})`;
    }

    /**
     * Check if timeline namespace exists
     */
    checkTimelineNamespaceSNL(userEmail) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `list(namespace)\nvalues("${namespace}")\non(timeline)`;
    }

    /**
     * Check if timeline entity exists
     */
    checkTimelineEntitySNL(userEmail, entityName) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `list(structure)\nvalues("${entityName}")\non(timeline.${namespace})`;
    }

    /**
     * Create timeline entity SNL
     */
    createTimelineEntitySNL(userEmail, entityName) {
        const namespace = this.formatEmailForNamespace(userEmail);
        return `set(structure)\nvalues("${entityName}", {})\non(timeline.${namespace}.${entityName})`;
    }

    /**
     * Parse timeline entries response
     */
    parseTimelineEntries(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        return Object.entries(response).map(([id, entry]) => ({
            id,
            ...entry
        }));
    }

    /**
     * Parse timeline search response
     */
    parseTimelineSearch(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const entries = [];
        for (const [entityName, entityData] of Object.entries(response)) {
            if (typeof entityData === 'object') {
                for (const [entryId, entryData] of Object.entries(entityData)) {
                    entries.push({
                        id: entryId,
                        entity: entityName,
                        ...entryData
                    });
                }
            }
        }

        return entries;
    }
}

module.exports = TimelineSNL;