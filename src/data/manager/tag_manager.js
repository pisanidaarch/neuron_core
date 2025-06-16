// src/data/manager/tag_manager.js

const TagSNL = require('../snl/tag_snl');
const NeuronDBSender = require('../neuron_db/sender');
const TagInfo = require('../../cross/entity/tag_info');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * Tag Manager - Manages tag operations
 */
class TagManager {
    constructor() {
        this.snl = new TagSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Add tag to entity
     */
    async addTag(database, namespace, entity, tag, userEmail, token) {
        try {
            this.snl.validateTagName(tag);

            const addSNL = this.snl.addTagSNL(database, namespace, entity, tag);
            const response = await this.sender.executeSNL(addSNL, token);

            return {
                success: true,
                tag: tag,
                path: `${database}.${namespace}.${entity}`,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to add tag: ${error.message}`);
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(database, namespace, entity, tag, token) {
        try {
            this.snl.validateTagName(tag);

            const removeSNL = this.snl.removeTagSNL(database, namespace, entity, tag);
            const response = await this.sender.executeSNL(removeSNL, token);

            return {
                success: true,
                tag: tag,
                path: `${database}.${namespace}.${entity}`,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to remove tag: ${error.message}`);
        }
    }

    /**
     * List all tags
     */
    async listTags(database = null, pattern = '*', token) {
        try {
            const listSNL = this.snl.listTagsSNL(database, pattern);
            const response = await this.sender.executeSNL(listSNL, token);

            return this.snl.parseTagsList(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to list tags: ${error.message}`);
        }
    }

    /**
     * Match tags by patterns
     */
    async matchTags(patterns, database = null, token) {
        try {
            if (!Array.isArray(patterns) || patterns.length === 0) {
                throw new Error('At least one pattern is required');
            }

            const matchSNL = this.snl.matchTagsSNL(database, patterns);
            const response = await this.sender.executeSNL(matchSNL, token);

            return this.snl.parseMatchTags(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to match tags: ${error.message}`);
        }
    }

    /**
     * View tag content
     */
    async viewTag(tag, database = null, token) {
        try {
            this.snl.validateTagName(tag);

            const viewSNL = this.snl.viewTagSNL(tag, database);
            const response = await this.sender.executeSNL(viewSNL, token);

            return this.snl.parseTagView(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to view tag: ${error.message}`);
        }
    }

    /**
     * Check if user can modify tag on entity
     */
    async canModifyTag(database, namespace, userEmail, permissions) {
        try {
            // Check if it's user's own data
            const userDataNamespace = userEmail.replace(/\./g, '_').replace('@', '_at_');
            if (database === 'user-data' && namespace === userDataNamespace) {
                return true;
            }

            // Check permissions for other databases
            const permission = permissions.find(p => p.database === database);
            return permission && permission.level >= 2; // write permission

        } catch (error) {
            return false;
        }
    }
}

module.exports = TagManager;