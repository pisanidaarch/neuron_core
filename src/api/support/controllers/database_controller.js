// src/api/support/controllers/database_controller.js

const DatabaseSupportManager = require('../../../data/manager/database_support_manager');
const AISender = require('../../../data/neuron_db/ai_sender');
const KeysVO = require('../../../cross/entity/keys_vo');
const AuthMiddleware = require('../../security/middleware/auth_middleware');

/**
 * DatabaseController - Handles database management operations
 */
class DatabaseController {
    constructor() {
        this.databaseManager = new DatabaseSupportManager();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * List databases
     */
    async listDatabases(req, res) {
        try {
            const { ai_name } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const databases = await this.databaseManager.listDatabases(token);

            res.json({
                success: true,
                data: databases
            });

        } catch (error) {
            console.error('Error listing databases:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Create database
     */
    async createDatabase(req, res) {
        try {
            const { ai_name } = req.params;
            const { name } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!name) {
                return res.status(400).json({ error: 'Database name is required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user has main admin permission
            if (!this.databaseManager.hasMainAdminPermission(userInfo.permissions)) {
                return res.status(403).json({ error: 'Main admin permission required to create databases' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const success = await this.databaseManager.createDatabase(name, token);

            res.json({
                success,
                message: success ? 'Database created successfully' : 'Failed to create database'
            });

        } catch (error) {
            console.error('Error creating database:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Drop database
     */
    async dropDatabase(req, res) {
        try {
            const { ai_name, name } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user has main admin permission
            if (!this.databaseManager.hasMainAdminPermission(userInfo.permissions)) {
                return res.status(403).json({ error: 'Main admin permission required to drop databases' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const success = await this.databaseManager.dropDatabase(name, token);

            res.json({
                success,
                message: success ? 'Database dropped successfully' : 'Failed to drop database'
            });

        } catch (error) {
            console.error('Error dropping database:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * List namespaces
     */
    async listNamespaces(req, res) {
        try {
            const { ai_name, db } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const namespaces = await this.databaseManager.listNamespaces(db, token);

            res.json({
                success: true,
                data: namespaces
            });

        } catch (error) {
            console.error('Error listing namespaces:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Create namespace
     */
    async createNamespace(req, res) {
        try {
            const { ai_name, db } = req.params;
            const { name } = req.body;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            if (!name) {
                return res.status(400).json({ error: 'Namespace name is required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user has admin permission on this database
            if (!this.databaseManager.hasAdminPermission(db, userInfo.permissions)) {
                return res.status(403).json({ error: `Admin permission required on database ${db} to create namespaces` });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const success = await this.databaseManager.createNamespace(db, name, token);

            res.json({
                success,
                message: success ? 'Namespace created successfully' : 'Failed to create namespace'
            });

        } catch (error) {
            console.error('Error creating namespace:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Drop namespace
     */
    async dropNamespace(req, res) {
        try {
            const { ai_name, db, name } = req.params;
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' });
            }

            // Validate token and get user info
            const userInfo = await this.authMiddleware.validateToken(token, ai_name);
            if (!userInfo) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user has admin permission on this database
            if (!this.databaseManager.hasAdminPermission(db, userInfo.permissions)) {
                return res.status(403).json({ error: `Admin permission required on database ${db} to drop namespaces` });
            }

            // Initialize manager with AI sender
            const keysVO = await KeysVO.getInstance();
            const aiSender = new AISender(ai_name, keysVO);
            this.databaseManager.initialize(aiSender);

            const success = await this.databaseManager.dropNamespace(db, name, token);

            res.json({
                success,
                message: success ? 'Namespace dropped successfully' : 'Failed to drop namespace'
            });

        } catch (error) {
            console.error('Error dropping namespace:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = DatabaseController;
