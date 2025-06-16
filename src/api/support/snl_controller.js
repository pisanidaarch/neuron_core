// src/api/support/snl_controller.js

const SNLService = require('../../core/support/snl_service');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * SNL Controller - HTTP layer for SNL operations
 */
class SNLController {
    constructor(aiName) {
        this.service = new SNLService(aiName);
    }

    /**
     * Execute SNL command
     */
    async executeSNL(req, res) {
        try {
            const { body, user, token } = this._extractRequestData(req);

            // Support both JSON and plain text
            let command;
            if (typeof body === 'string') {
                command = body;
            } else if (body.command) {
                command = body.command;
            } else {
                return res.status(400).json({
                    error: true,
                    message: 'SNL command is required'
                });
            }

            const result = await this.service.executeSNL(
                command,
                user.permissions,
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
        console.error('SNL Controller Error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json(error.toJSON());
        }

        res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
        });
    }
}

module.exports = SNLController;