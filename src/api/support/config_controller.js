// src/api/support/config_controller.js

const ConfigService = require('../../core/support/config_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * Config Controller - HTTP layer for AI configuration
 */
class ConfigController {
    constructor(aiName) {
        this.service = new ConfigService(aiName);
    }

    /**
     * Get AI configuration
     */
    async getAIConfig(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.getAIConfig(
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Update AI theme
     */
    async updateTheme(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.updateTheme(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'AI theme updated successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Update AI behavior
     */
    async updateBehavior(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.updateBehavior(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'AI behavior updated successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get behavior override
     */
    async getBehaviorOverride(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.getBehaviorOverride(
                user.permissions,
                token
            );

            res.json({
                error: false,
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Set behavior override
     */
    async setBehaviorOverride(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            const result = await this.service.setBehaviorOverride(
                body,
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Behavior override set successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Reset to default configuration
     */
    async resetToDefault(req, res) {
        try {
            const { user, token } = this._extractRequestData(req);

            const result = await this.service.resetToDefault(
                user.permissions,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'Configuration reset to default successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Extract request data
     */
    _extractRequestData(req) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('Authorization token is required');
        }

        const user = req.user;
        if (!user) {
            throw new AuthenticationError('User information not found');
        }

        return {
            params: req.params,
            query: req.query,
            body: req.body,
            user,
            token
        };
    }

    /**
     * Handle errors uniformly
     */
    _handleError(error, res) {
        console.error('Config Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = ConfigController;