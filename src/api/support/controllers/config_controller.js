// src/api/support/controllers/config_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const ConfigurationManager = require('../../../data/manager/configuration_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const Configuration = require('../../../cross/entity/configuration');
const { AuthenticationError, ValidationError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * Config Controller for NeuronCore Support API
 */
class ConfigController {
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
     * Validate user token and permissions
     * @param {string} token - JWT token
     * @param {string} requiredPermission - Required permission
     * @returns {Promise<Object>}
     */
    async validateUserPermissions(token, requiredPermission = null) {
        if (!token) {
            throw new AuthenticationError('Token is required');
        }

        const userInfo = await this.sender.validateToken(token);

        if (requiredPermission) {
            const hasPermission = userInfo.groups?.includes('admin') ||
                                userInfo.permissions?.some(p => p.permission === requiredPermission);

            if (!hasPermission) {
                throw new AuthorizationError(`Permission required: ${requiredPermission}`);
            }
        }

        return userInfo;
    }

    /**
     * Get configuration endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getConfig(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get configuration
            const configManager = new ConfigurationManager(aiToken);
            const config = await configManager.getConfiguration(aiName);

            res.json({
                error: false,
                data: config ? config.toObject() : Configuration.createDefault(aiName).toObject()
            });

        } catch (error) {
            console.error('Get config error:', error);

            if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get configuration'
                });
            }
        }
    }

    /**
     * Update configuration endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateConfig(req, res) {
        try {
            const { aiName } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');
            const configData = req.body;

            // Validate token and admin permissions
            const userInfo = await this.validateUserPermissions(token, 'config.manage');

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get current configuration
            const configManager = new ConfigurationManager(aiToken);
            let config = await configManager.getConfiguration(aiName);

            if (!config) {
                config = Configuration.createDefault(aiName);
            }

            // Update configuration with provided data
            if (configData.ui) config.updateUI(configData.ui);
            if (configData.features) config.updateFeatures(configData.features);
            if (configData.limits) config.updateLimits(configData.limits);
            if (configData.integrations) config.updateIntegrations(configData.integrations);

            config.updatedBy = userInfo.username;

            // Save configuration
            await configManager.saveConfiguration(config);

            res.json({
                error: false,
                message: 'Configuration updated successfully',
                data: config.toObject()
            });

        } catch (error) {
            console.error('Update config error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update configuration'
                });
            }
        }
    }

    /**
     * Update colors endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateColors(req, res) {
        try {
            const { aiName } = req.params;
            const { colors } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and admin permissions
            const userInfo = await this.validateUserPermissions(token, 'config.colors');

            if (!colors) {
                throw new ValidationError('Colors data is required');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get current configuration
            const configManager = new ConfigurationManager(aiToken);
            let config = await configManager.getConfiguration(aiName);

            if (!config) {
                config = Configuration.createDefault(aiName);
            }

            // Check if user can customize colors
            if (!config.canCustomizeColors(userInfo)) {
                throw new AuthorizationError('Color customization not allowed');
            }

            // Validate color formats
            if (colors.primary) {
                for (const [key, value] of Object.entries(colors.primary)) {
                    if (!Configuration.isValidHexColor(value)) {
                        throw new ValidationError(`Invalid hex color format for primary.${key}: ${value}`);
                    }
                }
            }

            if (colors.secondary) {
                for (const [key, value] of Object.entries(colors.secondary)) {
                    if (!Configuration.isValidHexColor(value)) {
                        throw new ValidationError(`Invalid hex color format for secondary.${key}: ${value}`);
                    }
                }
            }

            if (colors.gradients) {
                for (const [key, value] of Object.entries(colors.gradients)) {
                    if (!Configuration.isValidGradient(value)) {
                        throw new ValidationError(`Invalid gradient format for gradients.${key}: ${value}`);
                    }
                }
            }

            // Update colors
            config.updateColors(colors);
            config.updatedBy = userInfo.username;

            // Save configuration
            await configManager.saveConfiguration(config);

            res.json({
                error: false,
                message: 'Colors updated successfully',
                data: {
                    colors: config.colors,
                    cssVariables: config.getCSSVariables()
                }
            });

        } catch (error) {
            console.error('Update colors error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update colors'
                });
            }
        }
    }

    /**
     * Update logo endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateLogo(req, res) {
        try {
            const { aiName } = req.params;
            const { logo } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and admin permissions
            const userInfo = await this.validateUserPermissions(token, 'config.logo');

            if (!logo) {
                throw new ValidationError('Logo data is required');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get current configuration
            const configManager = new ConfigurationManager(aiToken);
            let config = await configManager.getConfiguration(aiName);

            if (!config) {
                config = Configuration.createDefault(aiName);
            }

            // Update logo
            config.updateLogo(logo);
            config.updatedBy = userInfo.username;

            // Save configuration
            await configManager.saveConfiguration(config);

            res.json({
                error: false,
                message: 'Logo updated successfully',
                data: {
                    logo: config.logo
                }
            });

        } catch (error) {
            console.error('Update logo error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update logo'
                });
            }
        }
    }

    /**
     * Update behavior endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateBehavior(req, res) {
        try {
            const { aiName } = req.params;
            const { behavior } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and admin permissions
            const userInfo = await this.validateUserPermissions(token, 'config.behavior');

            if (typeof behavior !== 'string') {
                throw new ValidationError('Behavior must be a string');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get current configuration
            const configManager = new ConfigurationManager(aiToken);
            let config = await configManager.getConfiguration(aiName);

            if (!config) {
                config = Configuration.createDefault(aiName);
            }

            // Check if user can customize behavior
            if (!config.canCustomizeBehavior(userInfo)) {
                throw new AuthorizationError('Behavior customization not allowed');
            }

            // Update behavior
            config.updateBehavior(behavior);
            config.updatedBy = userInfo.username;

            // Save configuration
            await configManager.saveConfiguration(config);

            res.json({
                error: false,
                message: 'Behavior updated successfully',
                data: {
                    behavior: config.behavior
                }
            });

        } catch (error) {
            console.error('Update behavior error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update behavior'
                });
            }
        }
    }

    /**
     * Execute SNL command endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async executeSNL(req, res) {
        try {
            const { aiName } = req.params;
            const { command } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token and admin permissions
            await this.validateUserPermissions(token, 'snl.execute');

            if (!command || typeof command !== 'string') {
                throw new ValidationError('SNL command is required');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Execute SNL command
            const result = await this.sender.executeSNL(command, aiToken);

            res.json({
                error: false,
                message: 'SNL command executed successfully',
                data: {
                    command: command,
                    result: result
                }
            });

        } catch (error) {
            console.error('Execute SNL error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to execute SNL command'
                });
            }
        }
    }
}

module.exports = ConfigController;