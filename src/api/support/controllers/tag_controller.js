// src/api/support/controllers/tag_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const { AuthenticationError, ValidationError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * TagController - Handles tag operations
 */
class TagController {
    constructor() {
        this.sender = new AISender();
    }

    /**
     * Get AI token for operations
     * @param {string} aiName - AI name
     * @returns {Promise<string>}
     */
    async getAIToken(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        return keysVO.getAIToken(aiName);
    }

    /**
     * Validate user permissions for tag operations
     * @param {string} token - JWT token
     * @param {string} database - Database name
     * @param {string} namespace - Namespace
     * @param {string} operation - Operation type
     * @returns {Promise<Object>}
     */
    async validateTagPermissions(token, database, namespace, operation = 'tag') {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        const userInfo = await this.sender.validateToken(token);

        // Check if user has permission for this database/namespace
        const hasPermission = this.checkTagPermission(userInfo, database, namespace, operation);

        if (!hasPermission) {
            throw new AuthorizationError(`No permission to ${operation} in ${database}.${namespace}`);
        }

        return userInfo;
    }

    /**
     * Check if user has tag permission
     * @param {Object} userInfo - User information
     * @param {string} database - Database name
     * @param {string} namespace - Namespace
     * @param {string} operation - Operation type
     * @returns {boolean}
     */
    checkTagPermission(userInfo, database, namespace, operation) {
        // Admins can tag anything
        if (userInfo.groups?.includes('admin')) {
            return true;
        }

        // For user-data database, users can tag their own namespace
        if (database === 'user-data') {
            const userNamespace = userInfo.email ? userInfo.email.replace(/[@.]/g, '_') : userInfo.username;
            return namespace === userNamespace;
        }

        // Check specific permissions
        if (userInfo.permissions) {
            return userInfo.permissions.some(p =>
                (p.database === database || p.database === '*') &&
                (p.namespace === namespace || p.namespace === '*') &&
                p.level >= 2 // Need write permission to tag
            );
        }

        return false;
    }

    /**
     * Add tag to entity endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async addTag(req, res) {
        try {
            const { aiName } = req.params;
            const { database, namespace, entity, tag } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Validate tag format
            this.validateTagFormat(tag);

            // Validate permissions
            await this.validateTagPermissions(token, database, namespace, 'tag');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Add tag using SNL
            const tagSNL = `tag(structure)\nvalues("${tag}")\non(${database}.${namespace}.${entity})`;
            await this.sender.executeSNL(tagSNL, aiToken);

            res.json({
                error: false,
                message: 'Tag added successfully',
                data: {
                    database,
                    namespace,
                    entity,
                    tag,
                    addedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Add tag error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to add tag'
                });
            }
        }
    }

    /**
     * Remove tag from entity endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async removeTag(req, res) {
        try {
            const { aiName } = req.params;
            const { database, namespace, entity, tag } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!database || !namespace || !entity || !tag) {
                throw new ValidationError('Database, namespace, entity, and tag are required');
            }

            // Validate permissions
            await this.validateTagPermissions(token, database, namespace, 'untag');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Remove tag using SNL
            const untagSNL = `untag(structure)\nvalues("${tag}")\non(${database}.${namespace}.${entity})`;
            await this.sender.executeSNL(untagSNL, aiToken);

            res.json({
                error: false,
                message: 'Tag removed successfully',
                data: {
                    database,
                    namespace,
                    entity,
                    tag,
                    removedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Remove tag error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to remove tag'
                });
            }
        }
    }

    /**
     * List tags endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listTags(req, res) {
        try {
            const { aiName } = req.params;
            const { database, namespace, pattern = '*' } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            let listTagsSNL;
            if (database && namespace) {
                // List tags in specific namespace
                listTagsSNL = `list(tag)\nvalues("${pattern}")\non(${database}.${namespace})`;
            } else if (database) {
                // List tags in specific database
                listTagsSNL = `list(tag)\nvalues("${pattern}")\non(${database})`;
            } else {
                // List all tags (admin only)
                if (!userInfo.groups?.includes('admin')) {
                    throw new AuthorizationError('Admin permissions required to list all tags');
                }
                listTagsSNL = `list(tag)\nvalues("${pattern}")\non()`;
            }

            const response = await this.sender.executeSNL(listTagsSNL, aiToken);
            const tags = this.parseTagsResponse(response);

            // Filter tags based on user permissions
            const accessibleTags = this.filterAccessibleTags(tags, userInfo, database, namespace);

            res.json({
                error: false,
                data: {
                    tags: accessibleTags,
                    total: accessibleTags.length,
                    database: database || 'all',
                    namespace: namespace || 'all',
                    pattern: pattern
                }
            });

        } catch (error) {
            console.error('List tags error:', error);

            if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list tags'
                });
            }
        }
    }

    /**
     * Search tags endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async searchTags(req, res) {
        try {
            const { aiName } = req.params;
            const { query, database, namespace } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!query) {
                throw new ValidationError('Search query is required');
            }

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            let searchTagsSNL;
            if (database && namespace) {
                searchTagsSNL = `match(tag)\nvalues("${query}")\non(${database}.${namespace})`;
            } else if (database) {
                searchTagsSNL = `match(tag)\nvalues("${query}")\non(${database})`;
            } else {
                // Search all tags (admin only)
                if (!userInfo.groups?.includes('admin')) {
                    throw new AuthorizationError('Admin permissions required to search all tags');
                }
                searchTagsSNL = `match(tag)\nvalues("${query}")\non()`;
            }

            const response = await this.sender.executeSNL(searchTagsSNL, aiToken);
            const tags = this.parseTagsResponse(response);

            // Filter results based on user permissions
            const accessibleTags = this.filterAccessibleTags(tags, userInfo, database, namespace);

            res.json({
                error: false,
                data: {
                    query: query,
                    results: accessibleTags,
                    count: accessibleTags.length,
                    database: database || 'all',
                    namespace: namespace || 'all'
                }
            });

        } catch (error) {
            console.error('Search tags error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to search tags'
                });
            }
        }
    }

    /**
     * Get tag details endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getTagDetails(req, res) {
        try {
            const { aiName } = req.params;
            const { tag, database, namespace } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!tag) {
                throw new ValidationError('Tag name is required');
            }

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            let viewTagSNL;
            if (database && namespace) {
                viewTagSNL = `view(tag)\nvalues("${tag}")\non(${database}.${namespace})`;
            } else if (database) {
                viewTagSNL = `view(tag)\nvalues("${tag}")\non(${database})`;
            } else {
                viewTagSNL = `view(tag)\nvalues("${tag}")\non()`;
            }

            const response = await this.sender.executeSNL(viewTagSNL, aiToken);
            const tagDetails = this.parseTagDetailsResponse(response, tag);

            res.json({
                error: false,
                data: {
                    tag: tag,
                    details: tagDetails,
                    database: database || 'all',
                    namespace: namespace || 'all',
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get tag details error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get tag details'
                });
            }
        }
    }

    /**
     * Validate tag format
     * @param {string} tag - Tag to validate
     * @throws {ValidationError} If tag is invalid
     */
    validateTagFormat(tag) {
        if (!tag || typeof tag !== 'string') {
            throw new ValidationError('Tag must be a non-empty string');
        }

        if (tag.length > 50) {
            throw new ValidationError('Tag must be 50 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validTagPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validTagPattern.test(tag)) {
            throw new ValidationError('Tag can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Parse tags response from SNL
     * @param {Object} response - SNL response
     * @returns {Array} Tags array
     */
    parseTagsResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        // Extract tags from response
        const tags = [];
        for (const [key, value] of Object.entries(response)) {
            if (typeof value === 'object' && value !== null) {
                // Tag details
                tags.push({
                    name: key,
                    ...value
                });
            } else if (typeof value === 'string') {
                // Simple tag name
                tags.push({
                    name: key,
                    entities: value.split(',').filter(e => e.trim())
                });
            }
        }

        return tags;
    }

    /**
     * Parse tag details response
     * @param {Object} response - SNL response
     * @param {string} tagName - Tag name
     * @returns {Object} Tag details
     */
    parseTagDetailsResponse(response, tagName) {
        if (!response || typeof response !== 'object') {
            return {
                name: tagName,
                entities: [],
                count: 0
            };
        }

        const details = {
            name: tagName,
            entities: [],
            count: 0,
            locations: []
        };

        // Extract entities and locations from response
        for (const [key, value] of Object.entries(response)) {
            if (Array.isArray(value)) {
                details.entities = value;
                details.count = value.length;
            } else if (typeof value === 'object' && value !== null) {
                details.locations.push({
                    location: key,
                    entities: Object.keys(value),
                    count: Object.keys(value).length
                });
                details.count += Object.keys(value).length;
            }
        }

        return details;
    }

    /**
     * Filter accessible tags based on user permissions
     * @param {Array} tags - All tags
     * @param {Object} userInfo - User information
     * @param {string} database - Database name
     * @param {string} namespace - Namespace
     * @returns {Array} Filtered tags
     */
    filterAccessibleTags(tags, userInfo, database, namespace) {
        // Admins can see all tags
        if (userInfo.groups?.includes('admin')) {
            return tags;
        }

        // For non-admins, filter based on permissions
        return tags.filter(tag => {
            // For user-data database, only show user's own tags
            if (database === 'user-data') {
                const userNamespace = userInfo.email ? userInfo.email.replace(/[@.]/g, '_') : userInfo.username;
                return !namespace || namespace === userNamespace;
            }

            // Check if user has permission to see this tag
            return this.checkTagPermission(userInfo, database || 'any', namespace || 'any', 'view');
        });
    }
}

module.exports = TagController;