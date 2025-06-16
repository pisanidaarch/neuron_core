// src/data/manager/user_data_manager.js

const UserDataSNL = require('../snl/user_data_snl');
const { NeuronDBError } = require('../../cross/entity/errors');

/**
 * User Data Manager - Manages user personal data storage
 */
class UserDataManager {
    constructor() {
        this.snl = new UserDataSNL();
        this.sender = null; // Will be injected
    }

    /**
     * Initialize with AI-specific sender
     */
    initialize(aiSender) {
        this.sender = aiSender;
    }

    /**
     * Store pointer data
     */
    async storePointer(userEmail, name, content, token) {
        try {
            this.snl.validateUserDataName(name);

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storePointerSNL(userEmail, name, content);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'pointer',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store pointer: ${error.message}`);
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(userEmail, name, data, token) {
        try {
            this.snl.validateUserDataName(name);

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storeStructureSNL(userEmail, name, data);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'structure',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store structure: ${error.message}`);
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(userEmail, name, values, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!Array.isArray(values) || values.length === 0) {
                throw new Error('Values array is required for enum');
            }

            // Ensure user data namespace exists
            await this._ensureUserDataNamespace(userEmail, token);

            const storeSNL = this.snl.storeEnumSNL(userEmail, name, values);
            const response = await this.sender.executeSNL(storeSNL, token);

            return {
                success: true,
                type: 'enum',
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to store enum: ${error.message}`);
        }
    }

    /**
     * Get user data
     */
    async getUserData(userEmail, dataType, name, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const getSNL = this.snl.getUserDataSNL(userEmail, dataType, name);
            const response = await this.sender.executeSNL(getSNL, token);

            return this.snl.parseUserData(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to get user data: ${error.message}`);
        }
    }

    /**
     * List user data
     */
    async listUserData(userEmail, dataType = null, pattern = '*', token) {
        try {
            if (dataType && !['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const listSNL = this.snl.listUserDataSNL(userEmail, dataType, pattern);
            const response = await this.sender.executeSNL(listSNL, token);

            return this.snl.parseUserDataList(response);

        } catch (error) {
            throw new NeuronDBError(`Failed to list user data: ${error.message}`);
        }
    }

    /**
     * Delete user data
     */
    async deleteUserData(userEmail, dataType, name, token) {
        try {
            this.snl.validateUserDataName(name);

            if (!['pointer', 'structure', 'enum'].includes(dataType)) {
                throw new Error('Invalid data type. Must be pointer, structure, or enum');
            }

            const deleteSNL = this.snl.deleteUserDataSNL(userEmail, dataType, name);
            const response = await this.sender.executeSNL(deleteSNL, token);

            return {
                success: true,
                type: dataType,
                name: name,
                userEmail: userEmail,
                data: response
            };

        } catch (error) {
            throw new NeuronDBError(`Failed to delete user data: ${error.message}`);
        }
    }

    /**
     * Ensure user data namespace exists
     */
    async _ensureUserDataNamespace(userEmail, token) {
        try {
            const checkSNL = this.snl.checkUserDataNamespaceSNL(userEmail);
            const response = await this.sender.executeSNL(checkSNL, token);

            const namespace = this.snl.formatEmailForNamespace(userEmail);
            if (!response || (Array.isArray(response) && !response.includes(namespace))) {
                // Create namespace via sender
                await this.sender.createNamespace(token, 'user-data', namespace);

                // Set permissions for user
                await this.sender.setPermission(token, userEmail, 'user-data', 2); // write permission
            }

        } catch (error) {
            // Log error but don't fail the operation
            console.warn('Failed to ensure user data namespace:', error.message);
        }
    }
}

module.exports = UserDataManager;