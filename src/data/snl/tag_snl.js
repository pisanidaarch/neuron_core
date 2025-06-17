// src/data/snl/tag_snl.js

const BaseSNL = require('./base_snl');

/**
 * Tag SNL - SNL operations for tag management
 * Tags are not entities themselves but operations on entities
 */
class TagSNL extends BaseSNL {
    constructor() {
        super();
    }

    /**
     * Add tag to entity
     */
    addTagSNL(database, namespace, entity, tag) {
        const path = this.buildPath(database, namespace, entity);
        return this.buildSNL('tag', 'structure', tag, path);
    }

    /**
     * Remove tag from entity
     */
    removeTagSNL(database, namespace, entity, tag) {
        const path = this.buildPath(database, namespace, entity);
        return this.buildSNL('untag', 'structure', tag, path);
    }

    /**
     * Match entities by tag patterns
     * This is the correct way to search for tagged entities
     */
    matchByTagsSNL(patterns, database = null, namespace = null) {
        const path = database ?
            (namespace ? this.buildPath(database, namespace) : database) :
            '';

        const patternStr = Array.isArray(patterns) ? patterns.join(',') : patterns;
        return this.buildSNL('match', 'tag', patternStr, path);
    }

    /**
     * Search for entities containing specific content
     * This searches the content, not tags specifically
     */
    searchEntitiesSNL(searchTerm, entityType, database = null, namespace = null) {
        this.validateEntityType(entityType);

        const path = database ?
            (namespace ? this.buildPath(database, namespace) : database) :
            '';

        return this.buildSNL('search', entityType, searchTerm, path);
    }

    /**
     * List entities of a specific type
     * This lists entities, not tags
     */
    listEntitiesSNL(entityType, pattern = '*', database = null, namespace = null) {
        this.validateEntityType(entityType);

        const path = database ?
            (namespace ? this.buildPath(database, namespace) : database) :
            '';

        return this.buildSNL('list', entityType, pattern, path);
    }

    /**
     * Parse match tags response
     * Returns array of paths that match the tag patterns
     */
    parseMatchTagsResponse(response) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response.map(path => {
            const parts = path.split('.');
            return {
                fullPath: path,
                database: parts[0] || null,
                namespace: parts[1] || null,
                entity: parts[2] || null
            };
        });
    }

    /**
     * Parse search/list response
     */
    parseEntityListResponse(response) {
        if (!response) {
            return [];
        }

        // If response is array, return as is
        if (Array.isArray(response)) {
            return response;
        }

        // If response is object, extract keys
        if (typeof response === 'object') {
            return Object.keys(response);
        }

        return [];
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

        if (tag.length > 50) {
            throw new Error('Tag name must be 50 characters or less');
        }

        return true;
    }

    /**
     * Build tag operation response
     */
    buildTagOperationResponse(operation, entity, tag, success = true) {
        return {
            operation: operation,
            entity: entity,
            tag: tag,
            success: success,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Helper to format multiple tags for match operation
     */
    formatTagsForMatch(tags) {
        if (!Array.isArray(tags) || tags.length === 0) {
            throw new Error('At least one tag is required for match operation');
        }

        // Validate each tag
        tags.forEach(tag => this.validateTagName(tag));

        return tags.join(',');
    }
}

module.exports = TagSNL;