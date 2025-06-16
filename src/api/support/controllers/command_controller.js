// src/api/support/controllers/command_controller.js

const { getInstance } = require('../../../data/manager/keys_vo_manager');
const CommandManager = require('../../../data/manager/command_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const Command = require('../../../cross/entity/command');
const { AuthenticationError, ValidationError, NotFoundError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * Command Controller for NeuronCore Support API
 */
class CommandController {
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
     * Create command endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async createCommand(req, res) {
        try {
            const { aiName } = req.params;
            const commandData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            const userInfo = await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Create command entity
            const command = new Command({
                ...commandData,
                aiName: aiName,
                authorId: userInfo.username
            });

            // Validate command
            const validation = command.validate();
            if (!validation.valid) {
                throw new ValidationError(`Command validation failed: ${validation.errors.join(', ')}`);
            }

            // Save command
            const commandManager = new CommandManager(aiToken);
            const savedCommand = await commandManager.saveCommand(command);

            res.status(201).json({
                error: false,
                message: 'Command created successfully',
                data: savedCommand.toObject()
            });

        } catch (error) {
            console.error('Create command error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to create command'
                });
            }
        }
    }

    /**
     * Get command endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async getCommand(req, res) {
        try {
            const { aiName, commandId } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get command
            const commandManager = new CommandManager(aiToken);
            const command = await commandManager.getCommand(commandId);

            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            res.json({
                error: false,
                data: command.toObject()
            });

        } catch (error) {
            console.error('Get command error:', error);

            if (error instanceof AuthenticationError || error instanceof NotFoundError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to get command'
                });
            }
        }
    }

    /**
     * Update command endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async updateCommand(req, res) {
        try {
            const { aiName, commandId } = req.params;
            const updateData = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            const userInfo = await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get existing command
            const commandManager = new CommandManager(aiToken);
            const command = await commandManager.getCommand(commandId);

            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            // Check if user can edit this command (author or admin)
            const canEdit = command.authorId === userInfo.username ||
                           userInfo.groups?.includes('admin');

            if (!canEdit) {
                throw new AuthorizationError('You can only edit your own commands');
            }

            // Update command data
            Object.assign(command, updateData);
            command.updatedAt = new Date().toISOString();

            // Validate updated command
            const validation = command.validate();
            if (!validation.valid) {
                throw new ValidationError(`Command validation failed: ${validation.errors.join(', ')}`);
            }

            // Save updated command
            const updatedCommand = await commandManager.saveCommand(command);

            res.json({
                error: false,
                message: 'Command updated successfully',
                data: updatedCommand.toObject()
            });

        } catch (error) {
            console.error('Update command error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError ||
                error instanceof NotFoundError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to update command'
                });
            }
        }
    }

    /**
     * Delete command endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async deleteCommand(req, res) {
        try {
            const { aiName, commandId } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            const userInfo = await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Get existing command
            const commandManager = new CommandManager(aiToken);
            const command = await commandManager.getCommand(commandId);

            if (!command) {
                throw new NotFoundError(`Command not found: ${commandId}`);
            }

            // Check if user can delete this command (author or admin)
            const canDelete = command.authorId === userInfo.username ||
                            userInfo.groups?.includes('admin');

            if (!canDelete) {
                throw new AuthorizationError('You can only delete your own commands');
            }

            // Prevent deletion of system commands
            if (command.isSystem) {
                throw new ValidationError('Cannot delete system commands');
            }

            // Delete command
            await commandManager.deleteCommand(commandId);

            res.json({
                error: false,
                message: 'Command deleted successfully',
                data: {
                    commandId: commandId,
                    deleted: true
                }
            });

        } catch (error) {
            console.error('Delete command error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError ||
                error instanceof NotFoundError || error instanceof AuthorizationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to delete command'
                });
            }
        }
    }

    /**
     * List commands endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async listCommands(req, res) {
        try {
            const { aiName } = req.params;
            const { page = 1, limit = 20, category, commandType, author } = req.query;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            const userInfo = await this.validateUserPermissions(token);

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // List commands
            const commandManager = new CommandManager(aiToken);
            const commands = await commandManager.listCommands({
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                commandType,
                author
            });

            res.json({
                error: false,
                data: {
                    commands: commands.map(cmd => cmd.toObject()),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: commands.length
                    }
                }
            });

        } catch (error) {
            console.error('List commands error:', error);

            if (error instanceof AuthenticationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to list commands'
                });
            }
        }
    }

    /**
     * Search commands endpoint
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async searchCommands(req, res) {
        try {
            const { aiName } = req.params;
            const { query, category, commandType } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            // Validate token
            await this.validateUserPermissions(token);

            if (!query || typeof query !== 'string') {
                throw new ValidationError('Search query is required');
            }

            // Get AI token
            const aiToken = await this.getAIToken(aiName);

            // Search commands
            const commandManager = new CommandManager(aiToken);
            const commands = await commandManager.searchCommands(query, {
                category,
                commandType
            });

            res.json({
                error: false,
                data: {
                    query: query,
                    results: commands.map(cmd => cmd.toObject()),
                    count: commands.length
                }
            });

        } catch (error) {
            console.error('Search commands error:', error);

            if (error instanceof AuthenticationError || error instanceof ValidationError) {
                res.status(error.statusCode).json({
                    error: true,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    error: true,
                    message: 'Failed to search commands'
                });
            }
        }
    }
}

module.exports = CommandController;