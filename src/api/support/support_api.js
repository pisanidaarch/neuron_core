// src/api/support/support_api.js

const express = require('express');
const createSupportRoutes = require('./routes');
const { getInstance } = require('../../data/manager/keys_vo_manager');

/**
 * Support API Setup
 */
class SupportAPI {
    constructor() {
        this.router = express.Router();
    }

    /**
     * Initialize support API for specific AI
     */
    initialize(aiName) {
        // Add AI-specific support routes
        const supportRoutes = createSupportRoutes(aiName);
        this.router.use(`/${aiName}/support`, supportRoutes);

        return this.router;
    }

    /**
     * Initialize support APIs for all available AIs
     */
    async initializeAll() {
        try {
            // Get all available AIs from KeysVO
            const keysVOManager = getInstance();
            const keysVO = await keysVOManager.getKeysVO();
            const aiNames = keysVO.getAINames();

            // Initialize routes for each AI
            for (const aiName of aiNames) {
                const supportRoutes = createSupportRoutes(aiName);
                this.router.use(`/${aiName}/support`, supportRoutes);
                console.log(`Support API initialized for AI: ${aiName}`);
            }

            return this.router;

        } catch (error) {
            console.error('Failed to initialize Support APIs:', error);
            throw error;
        }
    }

    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = SupportAPI;