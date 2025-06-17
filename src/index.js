// src/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import managers and utilities
const { initialize: initializeKeysVO } = require('./data/manager/keys_vo_manager');
const DatabaseInitializer = require('./data/initializer/database_initializer');
const SecurityInitializer = require('./data/initializer/security_initializer');
const StartupBanner = require('./utils/startup_banner');

// Import route modules
const securityRoutes = require('./api/security/routes');
const supportRoutes = require('./api/support/routes');

// Import error handlers
const { ErrorHandler } = require('./cross/entity/errors');

/**
 * NeuronCore main application
 */
class NeuronCore {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing NeuronCore...');

            // Initialize KeysVO first
            await this._initializeKeysVO();

            // Setup Express middleware
            this._setupMiddleware();

            // Setup routes
            this._setupRoutes();

            // Initialize databases
            await this._initializeDatabases();

            // Initialize security
            await this._initializeSecurity();

            this.initialized = true;
            console.log('✅ NeuronCore initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize NeuronCore:', error);
            throw error;
        }
    }

    /**
     * Initialize KeysVO singleton
     * @private
     */
    async _initializeKeysVO() {
        try {
            console.log('   🔑 Initializing KeysVO...');
            const keysVO = await initializeKeysVO();
            console.log('   ✅ KeysVO initialized');
        } catch (error) {
            console.error('   ❌ KeysVO initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     * @private
     */
    _setupMiddleware() {
        // Security middleware
        this.app.use(helmet());

        // CORS
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.text({ limit: '10mb' })); // For SNL commands

        // Logging
        this.app.use(morgan('combined'));

        // Error handling
        this.app.use(ErrorHandler.middleware);
    }

    /**
     * Setup application routes
     * @private
     */
    _setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                initialized: this.initialized
            });
        });

        // API routes organized by AI instance
        this.app.use('/api/security', securityRoutes);
        this.app.use('/api/support', supportRoutes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: true,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            res.status(500).json({
                error: true,
                message: 'Internal server error'
            });
        });
    }

    /**
     * Initialize databases
     * @private
     */
    async _initializeDatabases() {
        try {
            console.log('   🗄️  Initializing databases...');
            const dbInitializer = new DatabaseInitializer();
            await dbInitializer.initializeAll();
            console.log('   ✅ Databases initialized');
        } catch (error) {
            console.error('   ❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize security
     * @private
     */
    async _initializeSecurity() {
        try {
            console.log('   🔐 Initializing security...');
            const securityInitializer = new SecurityInitializer();
            await securityInitializer.initialize();
            console.log('   ✅ Security initialized');
        } catch (error) {
            console.error('   ❌ Security initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            // Display startup banner
            StartupBanner.display();

            await this.initialize();

            this.app.listen(this.port, () => {
                StartupBanner.displaySuccess(this.port);
            });

        } catch (error) {
            StartupBanner.displayError(error);
            process.exit(1);
        }
    }
}

// Create and start the application
const app = new NeuronCore();
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

module.exports = NeuronCore;