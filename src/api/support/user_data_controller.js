// src/api/support/user_data_controller.js

const UserDataService = require('../../core/support/user_data_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * User Data Controller - HTTP layer for user data operations
 */
class UserDataController {
    constructor(aiName) {
        this.service = new UserDataService(aiName);
    }

    /**
     * Store pointer data
     */
    async storePointer(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, content } = body;

            if (!name || !content) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and content are required'
                });
            }

            const result = await this.service.storePointer(
                name,
                content,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Pointer stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Store structure data
     */
    async storeStructure(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, data } = body;

            if (!name || !data) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and data are required'
                });
            }

            const result = await this.service.storeStructure(
                name,
                data,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Structure stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Store enum data
     */
    async storeEnum(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);
            const { name, values } = body;

            if (!name || !values) {
                return res.status(400).json({
                    error: true,
                    message: 'Name and values are required'
                });
            }

            const result = await this.service.storeEnum(
                name,
                values,
                user.email,
                token
            );

            res.status(201).json({
                error: false,
                message: 'Enum stored successfully',
                data: result
            });

        } catch (error) {
            this._handleError(error, res);
        }
    }

    /**
     * Get user data
     */
    async getUserData(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { type, name } = params;

            const result = await this.service.getUserData(
                type,
                name,
                user.email,
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
     * List user data
     */
    async listUserData(req, res) {
        try {
            const { query, user, token } = this._extractRequestData(req);
            const { type, pattern } = query;

            const result = await this.service.listUserData(
                type,
                pattern,
                user.email,
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
     * Delete user data
     */
    async deleteUserData(req, res) {
        try {
            const { params, user, token } = this._extractRequestData(req);
            const { type, name } = params;

            const result = await this.service.deleteUserData(
                type,
                name,
                user.email,
                token
            );

            res.json({
                error: false,
                message: 'User data deleted successfully',
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
        console.error('User Data Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = UserDataController;