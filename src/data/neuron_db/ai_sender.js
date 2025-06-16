// src/data/neuron_db/ai_sender.js

const NeuronDBSender = require('./sender');
const config = require('../../cross/entity/config');
const KeysVO = require('../../cross/entity/keys_vo');

/**
 * AI Sender - NeuronDB sender for specific AI instance
 */
class AISender extends NeuronDBSender {
    constructor(aiName) {
        super(config.get('neuronDB.url'));
        this.aiName = aiName;
        this.aiToken = null;
        this._initializeToken();
    }

    /**
     * Initialize AI token from KeysVO
     */
    _initializeToken() {
        try {
            const keysVO = KeysVO.getInstance();
            this.aiToken = keysVO.getAIToken(this.aiName);

            if (!this.aiToken) {
                console.warn(`No token found for AI: ${this.aiName}`);
            }
        } catch (error) {
            console.error(`Failed to initialize token for AI ${this.aiName}:`, error);
        }
    }

    /**
     * Execute SNL with AI token
     */
    async executeSNLWithAIToken(snlCommand) {
        if (!this.aiToken) {
            this._initializeToken();
        }

        if (!this.aiToken) {
            throw new Error(`No token available for AI: ${this.aiName}`);
        }

        return await this.executeSNL(snlCommand, this.aiToken);
    }

    /**
     * Get AI token
     */
    getAIToken() {
        return this.aiToken;
    }

    /**
     * Update AI token
     */
    updateAIToken(newToken) {
        this.aiToken = newToken;
    }

    /**
     * Get AI name
     */
    getAIName() {
        return this.aiName;
    }

    /**
     * Refresh token from KeysVO
     */
    refreshToken() {
        this._initializeToken();
    }

    /**
     * Execute SNL with user token (for user-specific operations)
     */
    async executeSNLWithUserToken(snlCommand, userToken) {
        return await this.executeSNL(snlCommand, userToken);
    }

    /**
     * Execute SNL automatically choosing appropriate token
     */
    async executeSNL(snlCommand, token = null) {
        // If no token provided, use AI token
        const useToken = token || this.aiToken;

        if (!useToken) {
            throw new Error(`No token available for SNL execution`);
        }

        return await super.executeSNL(snlCommand, useToken);
    }
}

module.exports = AISender;