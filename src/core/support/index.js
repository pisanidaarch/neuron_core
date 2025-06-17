// src/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('../config.json');

// Import initializers
const SystemInitializer = require('./data/initializer/system_initializer');

// Import routes (to be implemented)
// const authRoutes = require('./api/security/auth_routes');
// const userRoutes = require('./api/security/user_routes');
// const supportRoutes = require('./api/support/support_routes');

/**
 * NeuronCore Application
 */
class NeuronCoreApp {
    constructor() {
        this.app = express();
        this.port = config.server.port || 3000;
        this.systemInitializer = new SystemInitializer();
    }

    /**
     * Initialize middleware
     */
    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet());

        // CORS
        this.app.use(cors({
            origin: config.server.cors_origin,
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json());
        this.app.use(express.text()); // For SNL commands

        // Logging
        this.app.use(morgan(config.logging?.format || 'combined'));

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
    }

    /**
     * Initialize routes
     */
    initializeRoutes() {
        // API routes will be organized by AI instance
        // Pattern: /api/{module}/{ai_name}/{endpoint}

        // Security routes
        // this.app.use('/api/security', authRoutes);
        // this.app.use('/api/security', userRoutes);

        // Support routes
        // this.app.use('/api/support', supportRoutes);

        // Core routes (TODO)
        // this.app.use('/api/core', coreRoutes);

        // Temporary example routes for testing
        this.app.post('/api/security/:aiName/auth/login', async (req, res) => {
            try {
                const { aiName } = req.params;
                const { username, password } = req.body;

                // TODO: Implement with AuthService
                res.json({
                    message: 'Login endpoint - To be implemented',
                    aiName,
                    username
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/support/:aiName/snl', async (req, res) => {
            try {
                const { aiName } = req.params;
                const snlCommand = req.body;

                // TODO: Implement with SNLService
                res.json({
                    message: 'SNL endpoint - To be implemented',
                    aiName,
                    command: snlCommand
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.path} not found`
            });
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);

            const status = err.statusCode || 500;
            const message = err.message || 'Internal Server Error';

            res.status(status).json({
                error: err.name || 'Error',
                message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });
    }

    /**
     * Initialize system
     */
    async initializeSystem() {
        console.log('🚀 Initializing NeuronCore system...');

        try {
            // Initialize databases and default data
            await this.systemInitializer.initialize();

            console.log('✅ System initialization complete');
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start server
     */
    async start() {
        try {
            // Initialize system
            await this.initializeSystem();

            // Initialize middleware
            this.initializeMiddleware();

            // Initialize routes
            this.initializeRoutes();

            // Start listening
            this.app.listen(this.port, () => {
                console.log(`🚀 NeuronCore server running on port ${this.port}`);
                console.log(`📍 Health check: http://localhost:${this.port}/health`);
                console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

                // Log available AI instances
                const aiInstances = Object.keys(config.ai_instances || {});
                console.log(`🤖 Available AI instances: ${aiInstances.join(', ')}`);
            });

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Create and start application
const app = new NeuronCoreApp();
app.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});