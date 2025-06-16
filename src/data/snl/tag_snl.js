// src/data/snl/tag_snl.js

/**
 * Tag SNL - SNL operations for tag management
 */
class TagSNL {
    constructor() {
        // Tag operations
    }

    /**
     * Add tag SNL
     */
    addTagSNL(database, namespace, entity, tag) {
        return `tag(structure)\nvalues("${tag}")\non(${database}.${namespace}.${entity})`;
    }

    /**
     * Remove tag SNL
     */
    removeTagSNL(database, namespace, entity, tag) {
        return `untag(structure)\nvalues("${tag}")\non(${database}.${namespace}.${entity})`;
    }

    /**
     * List all tags SNL
     */
    listTagsSNL(database = null, pattern = '*') {
        if (database) {
            return `list(tag)\nvalues("${pattern}")\non(${database})`;
        }
        return `list(tag)\nvalues("${pattern}")\non()`;
    }

    /**
     * Match tags by pattern SNL
     */
    matchTagsSNL(database = null, patterns = []) {
        const patternStr = patterns.join(',');
        if (database) {
            return `match(tag)\nvalues("${patternStr}")\non(${database})`;
        }
        return `match(tag)\nvalues("${patternStr}")\non()`;
    }

    /**
     * View tag content SNL
     */
    viewTagSNL(tag, database = null) {
        if (database) {
            return `view(tag)\nvalues("${tag}")\non(${database})`;
        }
        return `view(tag)\nvalues("${tag}")\non()`;
    }

    /**
     * Check entity type for tagging
     */
    getEntityTypeSNL(database, namespace, entity) {
        return `list(structure)\nvalues("${entity}")\non(${database}.${namespace})`;
    }

    /**
     * Parse tags list response
     */
    parseTagsList(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response;
    }

    /**
     * Parse tag view response
     */
    parseTagView(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const entities = [];
        for (const [path, data] of Object.entries(response)) {
            entities.push({
                path,
                data
            });
        }

        return entities;
    }

    /**
     * Parse match tags response
     */
    parseMatchTags(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response;
    }

    /**
     * Validate tag name
     */
    validateTagName(tag) {
        if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error('Tag name is required');
        }

        // Tag names should not contain special characters
        if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
            throw new Error('Tag name can only contain letters, numbers, dashes, and underscores');
        }

        return true;
    }
}

module.exports = TagSNL;