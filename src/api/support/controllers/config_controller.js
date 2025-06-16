// src/api/support/controllers/config_controller.js

const AIConfig = require('../../../cross/entity/ai_config');
const ConfigManager = require('../../../data/manager/config_manager');
const ConfigSender = require('../../../data/neuron_db/config_sender');
const KeysVO = require('../../../cross/entity/keys_vo');
const AuthMiddleware = require('../../security/middleware/auth_middleware');

/**
 * ConfigController - Handles AI configuration operations
 */
class ConfigController {
    constructor() {
        this.configManager = new ConfigManager();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * Get AI configuration
     */
    async getConfig(req, res) {
        try {
            const { ai_name } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with config sender
            const keysVO = await KeysVO.getInstance();
            const configSender = new ConfigSender(keysVO);
            this.configManager.initialize(configSender);

            let config = await this.configManager.getConfig(ai_name, keysVO.getConfigToken());

            // If no config exists, return default
            if (!config) {
                config = new AIConfig({ ai_name });
            }

            res.json({
                success: true,
                data: config
            });

        } catch (error) {
            console.error('Error getting config:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update theme
     */
    async updateTheme(req, res) {
        try {
            const { ai_name } = req.params;
            const themeData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and check admin permission
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user is admin for this AI
            const isAdmin = userInfo.groups && userInfo.groups.includes('admin');
            if (!isAdmin) {
                return res.status(403).json({ error: 'Admin permission required to update theme' });
            }

            // Initialize manager with config sender
            const keysVO = await KeysVO.getInstance();
            const configSender = new ConfigSender(keysVO);
            this.configManager.initialize(configSender);

            const success = await this.configManager.updateTheme(
                ai_name,
                themeData,
                userInfo.email,
                keysVO.getConfigToken()
            );

            res.json({
                success,
                message: success ? 'Theme updated successfully' : 'Failed to update theme'
            });

        } catch (error) {
            console.error('Error updating theme:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update behavior
     */
    async updateBehavior(req, res) {
        try {
            const { ai_name } = req.params;
            const behaviorData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and check admin permission
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user is admin for this AI
            const isAdmin = userInfo.groups && userInfo.groups.includes('admin');
            if (!isAdmin) {
                return res.status(403).json({ error: 'Admin permission required to update behavior' });
            }

            // Initialize manager with config sender
            const keysVO = await KeysVO.getInstance();
            const configSender = new ConfigSender(keysVO);
            this.configManager.initialize(configSender);

            const success = await this.configManager.updateBehavior(
                ai_name,
                behaviorData,
                userInfo.email,
                keysVO.getConfigToken()
            );

            res.json({
                success,
                message: success ? 'Behavior updated successfully' : 'Failed to update behavior'
            });

        } catch (error) {
            console.error('Error updating behavior:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ConfigController;