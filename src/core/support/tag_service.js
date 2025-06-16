// src/core/support/tag_service.js

const TagManager = require('../../data/manager/tag_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const TagInfo = require('../../cross/entity/tag_info');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Tag Service - Business logic for tag operations
 */
class TagService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new TagManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Add tag to entity
     */
    async addTag(database, namespace, entity, tag, userPermissions, userEmail, token) {
        try {
            // Validate inputs
            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Check permissions
            const canModify = await this.manager.canModifyTag(database, namespace, userEmail, userPermissions);
            if (!canModify) {
                throw new AuthorizationError(`Insufficient permissions to add tag to ${database}.${namespace}.${entity}`);
            }

            const result = await this.manager.addTag(database, namespace, entity, tag, userEmail, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(database, namespace, entity, tag, userPermissions, userEmail, token) {
        try {
            // Validate inputs
            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Check permissions
            const canModify = await this.manager.canModifyTag(database, namespace, userEmail, userPermissions);
            if (!canModify) {
                throw new AuthorizationError(`Insufficient permissions to remove tag from ${database}.${namespace}.${entity}`);
            }

            const result = await this.manager.removeTag(database, namespace, entity, tag, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * List tags
     */
    async listTags(database = null, pattern = '*', userPermissions, token) {
        try {
            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to list tags in ${database}`);
                }
            }

            const tags = await this.manager.listTags(database, pattern, token);

            return {
                database,
                pattern,
                tags,
                count: tags.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Match tags by patterns
     */
    async matchTags(patterns, database = null, userPermissions, token) {
        try {
            if (!Array.isArray(patterns) || patterns.length === 0) {
                throw new ValidationError('At least one pattern is required');
            }

            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to search tags in ${database}`);
                }
            }

            const matches = await this.manager.matchTags(patterns, database, token);

            return {
                patterns,
                database,
                matches,
                count: matches.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * View tag content
     */
    async viewTag(tag, database = null, userPermissions, token) {
        try {
            if (!tag) {
                throw new ValidationError('Tag name is required');
            }

            // If database specified, check permissions
            if (database) {
                const hasPermission = userPermissions.some(p => p.database === database && p.level >= 1);
                if (!hasPermission) {
                    throw new AuthorizationError(`Insufficient permissions to view tags in ${database}`);
                }
            }

            const entities = await this.manager.viewTag(tag, database, token);

            return {
                tag,
                database,
                entities,
                count: entities.length
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = TagService;

