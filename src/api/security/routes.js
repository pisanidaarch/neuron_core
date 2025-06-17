// src/api/security/routes.js

const express = require('express');
const AuthController = require('./controllers/auth_controller');
const { ErrorHandler } = require('../../cross/entity/errors');

const router = express.Router();

// Initialize controllers
const authController = new AuthController();

/**
 * Security API Routes
 *
 * All routes are prefixed with /api/security
 * AI-specific routes include {aiName} parameter
 */

// ==================== AUTHENTICATION ROUTES ====================

/**
 * @route POST /api/security/{aiName}/auth/login
 * @desc Login user and get JWT token
 * @access Public
 * @body {string} username - Username or email
 * @body {string} password - User password
 */
router.post('/:aiName/auth/login', ErrorHandler.asyncWrapper(authController.login.bind(authController)));

/**
 * @route GET /api/security/{aiName}/auth/validate
 * @desc Validate JWT token and get user info
 * @access Private
 * @header Authorization: Bearer {token}
 */
router.get('/:aiName/auth/validate', ErrorHandler.asyncWrapper(authController.validateToken.bind(authController)));

/**
 * @route POST /api/security/{aiName}/auth/validate
 * @desc Validate JWT token (POST version for body data)
 * @access Private
 * @header Authorization: Bearer {token}
 */
router.post('/:aiName/auth/validate', ErrorHandler.asyncWrapper(authController.validateToken.bind(authController)));

/**
 * @route POST /api/security/{aiName}/auth/change-password
 * @desc Change user password
 * @access Private
 * @header Authorization: Bearer {token}
 * @body {string} newPassword - New password
 */
router.post('/:aiName/auth/change-password', ErrorHandler.asyncWrapper(authController.changePassword.bind(authController)));

/**
 * @route GET /api/security/{aiName}/auth/me
 * @desc Get current user information
 * @access Private
 * @header Authorization: Bearer {token}
 */
router.get('/:aiName/auth/me', ErrorHandler.asyncWrapper(authController.getCurrentUser.bind(authController)));

/**
 * @route POST /api/security/{aiName}/auth/logout
 * @desc Logout user (JWT is stateless, mainly for consistency)
 * @access Private
 * @header Authorization: Bearer {token}
 */
router.post('/:aiName/auth/logout', ErrorHandler.asyncWrapper(authController.logout.bind(authController)));

/**
 * @route POST /api/security/{aiName}/auth/refresh
 * @desc Refresh JWT token
 * @access Private
 * @header Authorization: Bearer {token}
 */
router.post('/:aiName/auth/refresh', ErrorHandler.asyncWrapper(authController.refreshToken.bind(authController)));

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * @route POST /api/security/{aiName}/users/create
 * @desc Create new user (Admin only)
 * @access Private (Admin)
 * @header Authorization: Bearer {admin_token}
 * @body {string} email - User email
 * @body {string} password - User password
 * @body {string} nick - User nickname
 */
router.post('/:aiName/users/create', ErrorHandler.asyncWrapper(authController.createUser.bind(authController)));

// ==================== LEGACY ROUTES (for backward compatibility) ====================

/**
 * @route POST /api/security/{aiName}/login
 * @desc Legacy login route
 * @deprecated Use /auth/login instead
 */
router.post('/:aiName/login', ErrorHandler.asyncWrapper(authController.login.bind(authController)));

/**
 * @route POST /api/security/{aiName}/validate
 * @desc Legacy validate route
 * @deprecated Use /auth/validate instead
 */
router.post('/:aiName/validate', ErrorHandler.asyncWrapper(authController.validateToken.bind(authController)));

/**
 * @route POST /api/security/{aiName}/change-password
 * @desc Legacy change password route
 * @deprecated Use /auth/change-password instead
 */
router.post('/:aiName/change-password', ErrorHandler.asyncWrapper(authController.changePassword.bind(authController)));

/**
 * @route POST /api/security/{aiName}/create-user
 * @desc Legacy create user route
 * @deprecated Use /users/create instead
 */
router.post('/:aiName/create-user', ErrorHandler.asyncWrapper(authController.createUser.bind(authController)));

// ==================== INFO ROUTES ====================

/**
 * @route GET /api/security/info
 * @desc Get security module information
 * @access Public
 */
router.get('/info', (req, res) => {
    res.json({
        error: false,
        message: 'NeuronCore Security API',
        data: {
            module: 'security',
            version: '1.0.0',
            description: 'Authentication and authorization for NeuronCore',
            features: [
                'JWT Authentication',
                'User Management',
                'Group-based Permissions',
                'Multi-AI Support',
                'Subscription Management'
            ],
            endpoints: {
                authentication: [
                    'POST /{aiName}/auth/login',
                    'GET /{aiName}/auth/validate',
                    'POST /{aiName}/auth/change-password',
                    'GET /{aiName}/auth/me',
                    'POST /{aiName}/auth/logout',
                    'POST /{aiName}/auth/refresh'
                ],
                users: [
                    'POST /{aiName}/users/create'
                ]
            },
            groups: [
                {
                    name: 'subscription_admin',
                    description: 'System group for payment gateway integration',
                    permissions: ['subscription.*']
                },
                {
                    name: 'admin',
                    description: 'Administrators who purchase AI subscriptions',
                    permissions: ['user.*', 'config.*', 'subscription.cancel', 'subscription.change_plan']
                },
                {
                    name: 'default',
                    description: 'Default users of the AI',
                    permissions: ['ai.chat', 'timeline.view_own', 'user_data.view_own']
                }
            ]
        }
    });
});

/**
 * @route GET /api/security/health
 * @desc Security module health check
 * @access Public
 */
router.get('/health', (req, res) => {
    res.json({
        error: false,
        message: 'Security module is healthy',
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    });
});

// ==================== ERROR HANDLING ====================

// Handle 404 for security routes
router.use('*', (req, res) => {
    res.status(404).json({
        error: true,
        message: 'Security endpoint not found',
        data: {
            path: req.originalUrl,
            method: req.method,
            available_endpoints: [
                'GET /api/security/info',
                'GET /api/security/health',
                'POST /api/security/{aiName}/auth/login',
                'GET /api/security/{aiName}/auth/validate',
                'POST /api/security/{aiName}/auth/change-password',
                'POST /api/security/{aiName}/users/create'
            ]
        }
    });
});

module.exports = router;