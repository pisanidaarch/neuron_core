// index.js

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import core components
const KeysVO = require('./src/cross/entity/keys_vo');
const DatabaseInitializer = require('./src/data/initializer/database_initializer');
const ConfigSender = require('./src/data/neuron_db/config_sender');

// Import route modules
const securityRoutes = require('./src/api/security/routes');
const supportRoutes = require('./src/api/support/routes');

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
            console.log('Initializing NeuronCore...');

            // Initialize KeysVO first
            await this._initializeKeysVO();

            // Setup Express middleware
            this._setupMiddleware();

            // Setup routes
            this._setupRoutes();

            // Initialize databases
            await this._initializeDatabases();

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

            // Use KeysVOManager to properly initialize from config file
            const KeysVOManager = require('./src/data/manager/keys_vo_manager');
            const keysVOManager = new KeysVOManager();

            const keysVO = await keysVOManager.initialize();

            // Validate that we have necessary keys
            const validation = keysVO.validate();
            if (!validation.valid) {
                throw new Error(`KeysVO validation failed: ${validation.errors.join(', ')}`);
            }

            console.log('   ✅ KeysVO initialized successfully');

        } catch (error) {
            console.error('   ❌ Failed to initialize KeysVO:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     * @private
     */
    _setupMiddleware() {
        console.log('   ⚙️  Setting up middleware...');

        // Enable CORS
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));

        // Parse JSON bodies
        this.app.use(express.json({ limit: '10mb' }));

        // Parse URL-encoded bodies
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });

        console.log('   ✅ Middleware configured');
    }

    /**
     * Setup application routes
     * @private
     */
    _setupRoutes() {
        console.log('   🛣️  Setting up routes...');

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                initialized: this.initialized,
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // Admin endpoints
        this._setupAdminRoutes();

        // Security module routes
        this.app.use('/', securityRoutes);

        // Support module routes
        this.app.use('/', supportRoutes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        console.log('   ✅ Routes configured');
    }

    /**
     * Setup admin routes
     * @private
     */
    _setupAdminRoutes() {
        // Database status endpoint
        this.app.get('/admin/database/status', async (req, res) => {
            try {
                const keysVO = await KeysVO.getInstance();
                const configSender = new ConfigSender(keysVO);
                const initializer = new DatabaseInitializer();
                initializer.initialize(configSender);

                const status = await initializer.getInitializationStatus(keysVO.getConfigToken());

                res.json({
                    success: true,
                    status,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting database status:', error);
                res.status(500).json({
                    error: 'Failed to get database status',
                    message: error.message
                });
            }
        });

        // Force database initialization endpoint
        this.app.post('/admin/database/initialize', async (req, res) => {
            try {
                console.log('🔄 Manual database initialization requested...');
                await this._initializeDatabases();

                res.json({
                    success: true,
                    message: 'Database initialization completed',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error initializing databases:', error);
                res.status(500).json({
                    error: 'Failed to initialize databases',
                    message: error.message
                });
            }
        });
    }

    /**
     * Initialize databases and structures
     * @private
     */
    async _initializeDatabases() {
        try {
            console.log('   🗃️  Initializing databases...');

            const keysVO = await KeysVO.getInstance();
            const configSender = new ConfigSender(keysVO);

            const initializer = new DatabaseInitializer();
            initializer.initialize(configSender);

            await initializer.runInitialization(keysVO.getConfigToken());

            console.log('   ✅ Databases initialized successfully');

        } catch (error) {
            console.error('   ❌ Failed to initialize databases:', error);
            // Don't throw here - allow the server to start even if database init fails
            console.warn('   ⚠️  Server will continue starting, but some features may not work');
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            this.app.listen(this.port, () => {
                console.log(`🚀 NeuronCore server running on port ${this.port}`);
                console.log(`📝 Health check: http://localhost:${this.port}/health`);
                console.log(`🔐 Security API: http://localhost:${this.port}/{ai_name}/security/*`);
                console.log(`🛠️  Support API: http://localhost:${this.port}/{ai_name}/support/*`);
                console.log(`⚙️  Admin API: http://localhost:${this.port}/admin/*`);
            });

        } catch (error) {
            console.error('Failed to start NeuronCore:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down NeuronCore...');

        // Add any cleanup logic here

        console.log('✅ NeuronCore shutdown complete');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    if (neuronCore) {
        await neuronCore.shutdown();
    }
});

process.on('SIGINT', async () => {
    console.log('SIGINT received');
    if (neuronCore) {
        await neuronCore.shutdown();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Create and start the application
const neuronCore = new NeuronCore();

// Start the server if this file is run directly
if (require.main === module) {
    neuronCore.start().catch(error => {
        console.error('Failed to start NeuronCore:', error);
        process.exit(1);
    });
}

module.exports = NeuronCore;