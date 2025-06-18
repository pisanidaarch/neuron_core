// src/api/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Middlewares
const aiValidator = require('./middlewares/aiValidator');
const errorHandler = require('./middlewares/errorHandler');

// Routes
const securityRoutes = require('./routes/security.routes');

// Config
const ConfigVO = require('../cross/entities/config.vo');

class Server {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Security middlewares
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later',
        data: null
      }
    });
    this.app.use(limiter);

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  setupRoutes() {
    // Health check (before AI validation)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        message: 'Neuron-Core is healthy',
        data: {
          service: 'neuron-core',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });
    });

    // API route with AI validation
    // Pattern: /api/{aiName}/...
    this.app.use('/api', aiValidator);

    // Security module routes
    // After AI validation, routes become: /security/...
    this.app.use('/security', securityRoutes);

    // Intelligence module routes (future implementation)
    // this.app.use('/intelligence', intelligenceRoutes);

    // Support module routes (future implementation)
    // this.app.use('/support', supportRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Welcome to Neuron-Core API',
        data: {
          version: '1.0.0',
          documentation: '/api/docs',
          availableModules: ['security', 'intelligence', 'support'],
          timestamp: new Date().toISOString()
        }
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.status(200).json({
        message: 'Neuron-Core API Documentation',
        data: {
          baseUrl: req.protocol + '://' + req.get('host'),
          urlPattern: '/api/{aiName}/{module}/{endpoint}',
          example: '/api/ami/security/login',
          modules: {
            security: {
              endpoints: [
                'POST /login - User authentication',
                'POST /change-password - Change user password',
                'GET /permissions - Get user permissions',
                'POST /users - Create new user',
                'POST /permissions/set - Set user permission',
                'POST /subscriptions - Create subscription',
                'GET /subscriptions/:email - Get subscription',
                'POST /subscriptions/:email/cancel - Cancel subscription',
                'GET /plans - Get all plans',
                'POST /plans - Create/update plan',
                'GET /groups - Get user groups',
                'POST /groups - Create user group',
                'POST /roles/set - Set user role'
              ]
            },
            intelligence: {
              status: 'Coming soon'
            },
            support: {
              status: 'Coming soon'
            }
          }
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
        data: {
          availableRoutes: [
            'GET /',
            'GET /health',
            'GET /api/docs',
            'POST /api/{aiName}/security/login',
            'And more... see /api/docs'
          ]
        }
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start(port) {
    try {
      this.server = this.app.listen(port, () => {
        console.log(`🚀 Neuron-Core server started on port ${port}`);
        console.log(`📖 API documentation: http://localhost:${port}/api/docs`);
        console.log(`💻 Health check: http://localhost:${port}/health`);
        console.log(`🔗 Example endpoint: http://localhost:${port}/api/{aiName}/security/login`);
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${port} is already in use`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });

      return this.server;
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('✅ Server stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = Server;