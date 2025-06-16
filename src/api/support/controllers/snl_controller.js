// src/api/support/controllers/snl_controller.js

const AISender = require('../../../data/neuron_db/ai_sender');
const KeysVO = require('../../../cross/entity/keys_vo');
const AuthMiddleware = require('../../security/middleware/auth_middleware');

/**
 * SNLController - Handles direct SNL execution
 */
class SNLController {
    constructor() {
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * Execute SNL command
     */
    async executeSNL(req, res) {
        try {
            const { ai_name } = req.params;
            const { command } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!command) {
                return res.status(400).json({ error: 'SNL command is required' });
            }

            // Validate token
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);

            const result = await aiSender.executeSNL(command, token);

            res.json({
                success: true,
                data: result,
                message: 'SNL command executed successfully'
            });

        } catch (error) {
            console.error('Error executing SNL:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = SNLController;