// src/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

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

            // Check if config exists
            await this._validateConfig();

            // Setup Express middleware
            this._setupMiddleware();

            // Setup routes
            this._setupRoutes();

            // Initialize KeysVO if available
            await this._initializeKeysVO();

            // Initialize databases if available
            await this._initializeDatabases();

            // Initialize security if available
            await this._initializeSecurity();

            this.initialized = true;
            console.log('✅ NeuronCore initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize NeuronCore:', error);
            throw error;
        }
    }

    /**
     * Validate configuration file
     * @private
     */
    async _validateConfig() {
        const configPath = path.join(process.cwd(), 'config.json');

        if (!fs.existsSync(configPath)) {
            throw new Error('config.json not found. Please create it from config.json.example');
        }

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('   ✅ Configuration file loaded');

            // Basic validation
            if (!config.database?.config_url) {
                throw new Error('database.config_url is required in config.json');
            }

            return config;
        } catch (error) {
            throw new Error(`Invalid config.json: ${error.message}`);
        }
    }

    /**
     * Initialize KeysVO singleton
     * @private
     */
    async _initializeKeysVO() {
        try {
            console.log('   🔑 Initializing KeysVO...');

            // Try to load KeysVO manager
            const keysVOManagerPath = path.join(__dirname, 'data/manager/keys_vo_manager.js');
            if (fs.existsSync(keysVOManagerPath)) {
                const { initialize } = require('./data/manager/keys_vo_manager');
                await initialize();
                console.log('   ✅ KeysVO initialized');
            } else {
                console.log('   ⚠️  KeysVO manager not found - skipping for now');
            }
        } catch (error) {
            console.warn('   ⚠️  KeysVO initialization failed:', error.message);
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

        // Basic error handling
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            res.status(500).json({
                error: true,
                message: 'Internal server error'
            });
        });
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

        // Admin status endpoint
        this.app.get('/admin/status', (req, res) => {
            res.json({
                error: false,
                message: 'Admin status',
                data: {
                    server: 'running',
                    initialized: this.initialized,
                    timestamp: new Date().toISOString()
                }
            });
        });

        // Try to load route modules if they exist
        this._loadRoutes('/api/security', './api/security/routes');
        this._loadRoutes('/api/support', './api/support/routes');

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: true,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });
    }

    /**
     * Load route module if it exists
     * @private
     */
    _loadRoutes(basePath, modulePath) {
        try {
            const routePath = path.join(__dirname, modulePath + '.js');
            if (fs.existsSync(routePath)) {
                const routes = require(modulePath);
                this.app.use(basePath, routes);
                console.log(`   ✅ Loaded routes: ${basePath}`);
            } else {
                console.log(`   ⚠️  Routes not found: ${basePath} - creating basic endpoint`);

                // Create basic endpoint
                this.app.get(`${basePath}/health`, (req, res) => {
                    res.json({
                        error: false,
                        message: `${basePath} module - implementation pending`
                    });
                });
            }
        } catch (error) {
            console.warn(`   ⚠️  Failed to load routes ${basePath}:`, error.message);
        }
    }

    /**
     * Initialize databases
     * @private
     */
    async _initializeDatabases() {
        try {
            console.log('   🗄️  Initializing databases...');

            const dbInitializerPath = path.join(__dirname, 'data/initializer/database_initializer.js');
            if (fs.existsSync(dbInitializerPath)) {
                const DatabaseInitializer = require('./data/initializer/database_initializer');
                const dbInitializer = new DatabaseInitializer();
                await dbInitializer.initializeAll();
                console.log('   ✅ Databases initialized');
            } else {
                console.log('   ⚠️  Database initializer not found - skipping for now');
            }
        } catch (error) {
            console.warn('   ⚠️  Database initialization failed:', error.message);
        }
    }

    /**
     * Initialize security
     * @private
     */
    async _initializeSecurity() {
        try {
            console.log('   🔐 Initializing security...');

            const securityInitializerPath = path.join(__dirname, 'data/initializer/security_initializer.js');
            if (fs.existsSync(securityInitializerPath)) {
                const SecurityInitializer = require('./data/initializer/security_initializer');
                const securityInitializer = new SecurityInitializer();
                await securityInitializer.initialize();
                console.log('   ✅ Security initialized');
            } else {
                console.log('   ⚠️  Security initializer not found - skipping for now');
            }
        } catch (error) {
            console.warn('   ⚠️  Security initialization failed:', error.message);
        }
    }

    /**
     * Start the server
     */
    async start() {
        try {
            // Display startup banner if available
            const bannerPath = path.join(__dirname, 'utils/startup_banner.js');
            if (fs.existsSync(bannerPath)) {
                const StartupBanner = require('./utils/startup_banner');
                StartupBanner.display();
                StartupBanner.displaySystemInfo();
            }

            await this.initialize();

            this.app.listen(this.port, () => {
                if (fs.existsSync(bannerPath)) {
                    const StartupBanner = require('./utils/startup_banner');

                    // Try to get KeysVO for status display
                    try {
                        const { getInstance } = require('./data/manager/keys_vo_manager');
                        const keysManager = getInstance();
                        const keysVO = keysManager.getKeysVO();
                        StartupBanner.displayConfigStatus(keysVO);
                    } catch (error) {
                        console.log('   ⚠️  Could not load KeysVO for status display');
                    }

                    StartupBanner.displayWarnings();
                    StartupBanner.displaySuccess(this.port);
                } else {
                    console.log(`🚀 NeuronCore started on port ${this.port}`);
                    console.log(`📍 Health check: http://localhost:${this.port}/health`);
                }
            });

        } catch (error) {
            if (fs.existsSync(path.join(__dirname, 'utils/startup_banner.js'))) {
                const StartupBanner = require('./utils/startup_banner');
                StartupBanner.displayError(error);
            } else {
                console.error('❌ NeuronCore failed to start:', error);
            }
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