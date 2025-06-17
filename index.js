// index.js

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import initializers
const DatabaseInitializer = require('./src/data/initializer/database_initializer');
const SecurityInitializer = require('./src/data/initializer/security_initializer');
const StartupBanner = require('./src/utils/startup_banner');

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

            // Use KeysVOManager to properly initialize from config file
            const { initialize } = require('./src/data/manager/keys_vo_manager');
            const keysVO = await initialize();

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
        console.log('   🛣  Setting up routes...');

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                initialized: this.initialized,
                version: '1.0.0'
            });
        });

        // Admin routes
        this.app.get('/admin/status', this._getAdminStatus.bind(this));
        this.app.post('/admin/database/initialize', this._reinitializeDatabase.bind(this));

        // Security API routes
        this.app.use('/api/security', securityRoutes);

        // Support API routes
        this.app.use('/api/support', supportRoutes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: 'NeuronCore',
                version: '1.0.0',
                description: 'Multi-AI orchestration platform with workflow capabilities',
                status: this.initialized ? 'initialized' : 'initializing',
                timestamp: new Date().toISOString(),
                endpoints: [
                    '/health',
                    '/admin/status',
                    '/api/security/{ai_name}/auth/login',
                    '/api/security/{ai_name}/auth/validate',
                    '/api/security/{ai_name}/auth/change-password',
                    '/api/security/{ai_name}/users/create',
                    '/api/support/info',
                    '/api/support/health'
                ]
            });
        });

        // Error handling middleware
        this.app.use(ErrorHandler.handleError);

        console.log('   ✅ Routes configured');
    }

    /**
     * Initialize databases
     * @private
     */
    async _initializeDatabases() {
        try {
            console.log('   📦 Initializing databases...');

            const dbInitializer = new DatabaseInitializer();
            await dbInitializer.initializeAll();

            console.log('   ✅ Databases initialized');

        } catch (error) {
            console.error('   ❌ Failed to initialize databases:', error);
            // Don't throw - database initialization might fail if NeuronDB is not available
            console.warn('   ⚠️  Continuing without database initialization');
        }
    }

    /**
     * Initialize security
     * @private
     */
    async _initializeSecurity() {
        try {
            console.log('   🔒 Initializing security...');

            const securityInitializer = new SecurityInitializer();
            await securityInitializer.initializeAll();

            console.log('   ✅ Security initialized');

        } catch (error) {
            console.error('   ❌ Failed to initialize security:', error);
            // Don't throw - security initialization might fail if NeuronDB is not available
            console.warn('   ⚠️  Continuing without security initialization');
        }
    }

    /**
     * Admin status endpoint
     * @private
     */
    async _getAdminStatus(req, res) {
        try {
            const { getInstance } = require('./src/data/manager/keys_vo_manager');
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            const status = {
                initialized: this.initialized,
                timestamp: new Date().toISOString(),
                configuration: {
                    aiInstances: keysVO.getAINames(),
                    configUrl: keysVO.getConfigUrl() ? 'configured' : 'missing',
                    jwtSecret: keysVO.getJWTSecret() ? 'configured' : 'missing'
                },
                databases: {
                    // TODO: Add database status check
                    status: 'unknown'
                },
                security: {
                    // TODO: Add security status check
                    status: 'unknown'
                }
            };

            res.json({
                error: false,
                message: 'Admin status retrieved',
                data: status
            });

        } catch (error) {
            console.error('Get admin status error:', error);
            res.status(500).json({
                error: true,
                message: 'Failed to get admin status'
            });
        }
    }

    /**
     * Reinitialize database endpoint
     * @private
     */
    async _reinitializeDatabase(req, res) {
        try {
            console.log('🔄 Reinitializing databases...');

            // Initialize databases
            await this._initializeDatabases();

            // Initialize security
            await this._initializeSecurity();

            res.json({
                error: false,
                message: 'Database and security reinitialized successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Reinitialize database error:', error);
            res.status(500).json({
                error: true,
                message: 'Failed to reinitialize database and security'
            });
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            // Display startup banner
            StartupBanner.display();
            StartupBanner.displaySystemInfo();

            await this.initialize();

            this.app.listen(this.port, () => {
                const { getInstance } = require('./src/data/manager/keys_vo_manager');
                const keysManager = getInstance();
                const keysVO = keysManager.getKeysVO();

                StartupBanner.displayConfigStatus(keysVO);
                StartupBanner.displayWarnings();
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
    StartupBanner.displayShutdown();
    process.exit(0);
});

process.on('SIGINT', () => {
    StartupBanner.displayShutdown();
    process.exit(0);
});

module.exports = NeuronCore;