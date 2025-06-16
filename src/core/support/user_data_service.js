// src/core/support/user_data_service.js

const UserDataManager = require('../../data/manager/user_data_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const { ValidationError } = require('../../cross/entity/errors');

/**
 * User Data Service - Business logic for user data operations
 */
class UserDataService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new UserDataManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Store pointer data
     */
    async storePointer(name, content, userEmail, token) {
        try {
            if (!content || typeof content !== 'string') {
                throw new ValidationError('Content must be a non-empty string');
            }

            const result = await this.manager.storePointer(userEmail, name, content, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(name, data, userEmail, token) {
        try {
            if (!data || typeof data !== 'object') {
                throw new ValidationError('Data must be an object');
            }

            const result = await this.manager.storeStructure(userEmail, name, data, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(name, values, userEmail, token) {
        try {
            if (!Array.isArray(values) || values.length === 0) {
                throw new ValidationError('Values must be a non-empty array');
            }

            const result = await this.manager.storeEnum(userEmail, name, values, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user data
     */
    async getUserData(dataType, name, userEmail, token) {
        try {
            const data = await this.manager.getUserData(userEmail, dataType, name, token);

            return {
                type: dataType,
                name,
                data
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * List user data
     */
    async listUserData(dataType = null, pattern = '*', userEmail, token) {
        try {
            const items = await this.manager.listUserData(userEmail, dataType, pattern, token);

            return {
                type: dataType,
                pattern,
                items,
                count: items.length
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user data
     */
    async deleteUserData(dataType, name, userEmail, token) {
        try {
            const result = await this.manager.deleteUserData(userEmail, dataType, name, token);

            return result;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserDataService;