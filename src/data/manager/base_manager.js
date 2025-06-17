// src/data/manager/base_manager.js

/**
 * Base Manager - Abstract base class for all managers
 * Implements common functionality and enforces the pattern:
 * entity (input) => manager => snl => sender => manager => entity (result)
 */
class BaseManager {
    constructor() {
        this.snl = null; // Must be set by child class
        this.sender = null; // Will be injected
    }

    /**
     * Initialize manager with sender
     * Must be called before using the manager
     */
    initialize(sender) {
        if (!sender) {
            throw new Error('Sender is required for manager initialization');
        }
        this.sender = sender;
    }

    /**
     * Validate manager is initialized
     */
    validateInitialized() {
        if (!this.sender) {
            throw new Error('Manager not initialized. Call initialize(sender) first.');
        }
        if (!this.snl) {
            throw new Error('SNL not set in manager. Set this.snl in constructor.');
        }
    }

    /**
     * Execute SNL command
     */
    async executeSNL(snlCommand, token) {
        this.validateInitialized();

        try {
            const response = await this.sender.executeSNL(snlCommand, token);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Execute authentication command
     */
    async executeAuth(endpoint, payload, token = null) {
        this.validateInitialized();

        try {
            const response = await this.sender.executeAuth(endpoint, payload, token);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Handle errors - can be overridden by child classes
     */
    handleError(error) {
        // Add context to error if needed
        if (error.message) {
            error.message = `[${this.constructor.name}] ${error.message}`;
        }
        return error;
    }

    /**
     * Log operation - can be overridden for custom logging
     */
    logOperation(operation, data = {}) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${this.constructor.name}] ${operation}:`, data);
        }
    }

    /**
     * Validate entity - must be implemented by child classes
     */
    validateEntity(entity) {
        throw new Error('validateEntity must be implemented by child class');
    }

    /**
     * Transform entity for storage - can be overridden
     */
    transformForStorage(entity) {
        return entity;
    }

    /**
     * Transform response to entity - can be overridden
     */
    transformToEntity(response) {
        return response;
    }

    /**
     * Get manager info
     */
    getInfo() {
        return {
            manager: this.constructor.name,
            initialized: !!this.sender,
            senderInfo: this.sender ? this.sender.getInfo() : null
        };
    }
}

module.exports = BaseManager;