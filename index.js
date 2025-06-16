// index.js

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import initializer
const DatabaseInitializer = require('./src/data/initializer/database_initializer');

// Import route modules
const securityRoutes = require('./src/api/security/routes');
const supportRoutes = require('./src/api/support/routes');

// Import error handler
const { ErrorHandler } = require('./src/cross/entity/errors');

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
            const { getInstance } = require('./src/data/manager/keys_vo_manager');
            const keysVOManager = getInstance();

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
        console.log('   🔧 Setting up middleware...');

        // CORS
        this.app.use(cors({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });

        console.log('   ✅ Middleware configured');
    }

    /**
     * Setup routes
     * @private
     */
    _setupRoutes() {
        console.log('   🛣 Setting up routes...');

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                initialized: this.initialized,
                version: '1.0.0'
            });
        });

        // API routes
        this.app.use('/api/security', securityRoutes);
        this.app.use('/api/support', supportRoutes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'NeuronCore',
                version: '1.0.0',
                description: 'Multi-AI orchestration platform with workflow capabilities',
                status: this.initialized ? 'ready' : 'initializing',
                endpoints: {
                    health: '/health',
                    security: '/api/security',
                    support: '/api/support'
                }
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: true,
                message: 'Endpoint not found',
                requestedPath: req.originalUrl
            });
        });

        // Error handler
        this.app.use(ErrorHandler.handleError);

        console.log('   ✅ Routes configured');
    }

    /**
     * Initialize databases
     * @private
     */
    async _initializeDatabases() {
        try {
            console.log('   💾 Initializing databases...');

            const initializer = new DatabaseInitializer();
            await initializer.initializeAll();

            console.log('   ✅ Databases initialized');
        } catch (error) {
            console.error('   ❌ Failed to initialize databases:', error);
            // Don't throw error, just warn - databases might already exist
            console.warn('   ⚠ Continuing without database initialization...');
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

            this.server = this.app.listen(this.port, () => {
                console.log(`🌟 NeuronCore server running on port ${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/health`);
                console.log(`🔐 Security API: http://localhost:${this.port}/api/security`);
                console.log(`🔧 Support API: http://localhost:${this.port}/api/support`);
            });

            // Handle graceful shutdown
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } catch (error) {
            console.error('❌ Failed to start NeuronCore:', error);
            process.exit(1);
        }
    }

    /**
     * Shutdown the server gracefully
     */
    async shutdown() {
        console.log('\n🛑 Shutting down NeuronCore...');

        if (this.server) {
            this.server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                console.log('⚠ Forcing server shutdown...');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    }
}

// Create and start the application
const neuronCore = new NeuronCore();

// Start server
neuronCore.start().catch(error => {
    console.error('Failed to start NeuronCore:', error);
    process.exit(1);
});

// Export for testing
module.exports = neuronCore;