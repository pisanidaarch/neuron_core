// src/core/support/config_service.js

const ConfigManager = require('../../data/manager/config_manager');
const AISender = require('../../data/neuron_db/ai_sender');
const AIConfig = require('../../cross/entity/ai_config');
const { AuthorizationError, ValidationError } = require('../../cross/entity/errors');

/**
 * Config Service - Business logic for AI configuration
 */
class ConfigService {
    constructor(aiName) {
        this.aiName = aiName;
        this.manager = new ConfigManager();
        this.aiSender = new AISender(aiName);
        this.manager.initialize(this.aiSender);
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(userPermissions, token) {
        try {
            const config = await this.manager.getAIConfig(this.aiName, token);

            return {
                config: config.toJSON(),
                canModify: this._canModifyConfig(userPermissions)
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update AI theme
     */
    async updateTheme(themeData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to modify AI configuration');
            }

            // Validate theme data
            this._validateThemeData(themeData);

            // Get current config
            const currentConfig = await this.manager.getAIConfig(this.aiName, token);

            // Update theme
            currentConfig.updateTheme(themeData);
            currentConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(currentConfig, token);

            return {
                ...result,
                theme: currentConfig.theme
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Update AI behavior
     */
    async updateBehavior(behaviorData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to modify AI configuration');
            }

            // Validate behavior data
            this._validateBehaviorData(behaviorData);

            // Get current config
            const currentConfig = await this.manager.getAIConfig(this.aiName, token);

            // Update behavior
            currentConfig.updateBehavior(behaviorData);
            currentConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(currentConfig, token);

            return {
                ...result,
                behavior: currentConfig.behavior
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(userPermissions, token) {
        try {
            const override = await this.manager.getBehaviorOverride(this.aiName, token);

            return {
                override,
                canModify: this._canModifyConfig(userPermissions)
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(behaviorData, userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to set behavior override');
            }

            // Validate behavior data
            this._validateBehaviorData(behaviorData);

            const result = await this.manager.setBehaviorOverride(this.aiName, behaviorData, token);

            return result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset to default configuration
     */
    async resetToDefault(userPermissions, userEmail, token) {
        try {
            // Validate permissions
            if (!this._canModifyConfig(userPermissions)) {
                throw new AuthorizationError('Admin permissions required to reset configuration');
            }

            const defaultConfig = new AIConfig({ aiName: this.aiName });
            defaultConfig.updatedBy = userEmail;

            const result = await this.manager.updateAIConfig(defaultConfig, token);

            return {
                ...result,
                config: defaultConfig.toJSON()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if user can modify configuration
     */
    _canModifyConfig(userPermissions) {
        // User needs admin permission on main database
        const mainPermission = userPermissions.find(p => p.database === 'main');
        return mainPermission && mainPermission.level >= 3;
    }

    /**
     * Validate theme data
     */
    _validateThemeData(themeData) {
        const errors = [];

        if (!themeData || typeof themeData !== 'object') {
            throw new ValidationError('Theme data must be an object');
        }

        // Validate primary colors if provided
        if (themeData.primaryColors) {
            const requiredPrimary = ['black', 'white', 'darkBlue', 'darkPurple'];
            for (const color of requiredPrimary) {
                if (themeData.primaryColors[color] && !this._isValidColor(themeData.primaryColors[color])) {
                    errors.push(`Invalid primary color ${color}`);
                }
            }
        }

        // Validate secondary colors if provided
        if (themeData.secondaryColors) {
            const requiredSecondary = ['purple', 'turquoise', 'blue', 'teal'];
            for (const color of requiredSecondary) {
                if (themeData.secondaryColors[color] && !this._isValidColor(themeData.secondaryColors[color])) {
                    errors.push(`Invalid secondary color ${color}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Theme validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Validate behavior data
     */
    _validateBehaviorData(behaviorData) {
        if (!behaviorData || typeof behaviorData !== 'object') {
            throw new ValidationError('Behavior data must be an object');
        }

        // Validate required fields if provided
        const stringFields = ['greeting', 'personality', 'defaultContext', 'responseStyle'];
        for (const field of stringFields) {
            if (behaviorData[field] && typeof behaviorData[field] !== 'string') {
                throw new ValidationError(`${field} must be a string`);
            }
        }
    }

    /**
     * Validate color format (hex)
     */
    _isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
}

module.exports = ConfigService;
