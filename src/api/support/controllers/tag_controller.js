// src/api/support/controllers/tag_controller.js

const TagSNL = require('../../../data/snl/tag_snl');
const AISender = require('../../../data/neuron_db/ai_sender');
const KeysVO = require('../../../cross/entity/keys_vo');
const AuthMiddleware = require('../../security/middleware/auth_middleware');

/**
 * TagController - Handles tag operations
 */
class TagController {
    constructor() {
        this.tagSNL = new TagSNL();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * Add tag to entity
     */
    async addTag(req, res) {
        try {
            const { ai_name } = req.params;
            const { database, namespace, entity, tag } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!database || !namespace || !entity || !tag) {
                return res.status(400).json({ error: 'Database, namespace, entity, and tag are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // For user-data database, check if it's user's own namespace
            if (database === 'user-data') {
                const userNamespace = userInfo.email.replace(/[@.]/g, '_').toLowerCase();
                if (namespace !== userNamespace) {
                    return res.status(403).json({ error: 'Can only add tags to your own data' });
                }
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const command = this.tagSNL.addTagSNL(database, namespace, entity, tag);
            await aiSender.executeSNL(command, token);

            res.json({
                success: true,
                message: 'Tag added successfully'
            });

        } catch (error) {
            console.error('Error adding tag:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Remove tag from entity
     */
    async removeTag(req, res) {
        try {
            const { ai_name } = req.params;
            const { database, namespace, entity, tag } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!database || !namespace || !entity || !tag) {
                return res.status(400).json({ error: 'Database, namespace, entity, and tag are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // For user-data database, check if it's user's own namespace
            if (database === 'user-data') {
                const userNamespace = userInfo.email.replace(/[@.]/g, '_').toLowerCase();
                if (namespace !== userNamespace) {
                    return res.status(403).json({ error: 'Can only remove tags from your own data' });
                }
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const command = this.tagSNL.removeTagSNL(database, namespace, entity, tag);
            await aiSender.executeSNL(command, token);

            res.json({
                success: true,
                message: 'Tag removed successfully'
            });

        } catch (error) {
            console.error('Error removing tag:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * List tags
     */
    async listTags(req, res) {
        try {
            const { ai_name } = req.params;
            const { database, namespace, pattern } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!database || !namespace) {
                return res.status(400).json({ error: 'Database and namespace are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const command = this.tagSNL.listTagsSNL(database, namespace, pattern);
            const response = await aiSender.executeSNL(command, token);

            const tags = this.tagSNL.parseTagListResponse(response);

            res.json({
                success: true,
                data: tags
            });

        } catch (error) {
            console.error('Error listing tags:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Search entities by tags
     */
    async searchByTags(req, res) {
        try {
            const { ai_name } = req.params;
            const { database, namespace, tags } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!database || !namespace || !tags || !Array.isArray(tags)) {
                return res.status(400).json({ error: 'Database, namespace, and tags array are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const command = this.tagSNL.searchByTagsSNL(database, namespace, tags);
            const response = await aiSender.executeSNL(command, token);

            const entities = this.tagSNL.parseTagSearchResponse(response);

            res.json({
                success: true,
                data: entities
            });

        } catch (error) {
            console.error('Error searching by tags:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * View entities with specific tag
     */
    async viewTag(req, res) {
        try {
            const { ai_name, tag } = req.params;
            const { database, namespace } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!database || !namespace) {
                return res.status(400).json({ error: 'Database and namespace are required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const command = this.tagSNL.viewTagSNL(database, namespace, tag);
            const response = await aiSender.executeSNL(command, token);

            const entities = this.tagSNL.parseTagSearchResponse(response);

            res.json({
                success: true,
                data: entities
            });

        } catch (error) {
            console.error('Error viewing tag:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TagController;