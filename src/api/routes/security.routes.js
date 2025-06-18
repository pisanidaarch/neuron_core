// src/api/routes/security.routes.js
const express = require('express');
const securityController = require('../controllers/security.controller');
const { authMiddleware, adminMiddleware, resourceOwnerMiddleware } = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { body, param } = require('express-validator');

const router = express.Router();

// ========== AUTHENTICATION ENDPOINTS ==========

/**
 * POST /security/login
 * Login with email and password
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validationMiddleware
], securityController.login);

/**
 * POST /security/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', [
  authMiddleware,
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validationMiddleware
], securityController.changePassword);

/**
 * GET /security/permissions
 * Get user permissions (requires authentication)
 */
router.get('/permissions', authMiddleware, securityController.getPermissions);

// ========== USER MANAGEMENT ENDPOINTS ==========

/**
 * POST /security/users
 * Create new user (requires admin role)
 */
router.post('/users', [
  authMiddleware,
  adminMiddleware,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('nick').optional().isString().withMessage('Nick must be a string'),
  body('role').optional().isIn(['default', 'admin']).withMessage('Role must be default or admin'),
  validationMiddleware
], securityController.createUser);

/**
 * POST /security/permissions/set
 * Set user permission for database (requires admin role)
 */
router.post('/permissions/set', [
  authMiddleware,
  adminMiddleware,
  body('email').isEmail().withMessage('Valid email is required'),
  body('database').isString().withMessage('Database name is required'),
  body('level').isInt({ min: 1, max: 3 }).withMessage('Level must be 1 (read-only), 2 (read-write), or 3 (admin)'),
  validationMiddleware
], securityController.setPermission);

// ========== SUBSCRIPTION ENDPOINTS ==========

/**
 * POST /security/subscriptions
 * Create new subscription (payment system integration)
 */
router.post('/subscriptions', [
  body('userEmail').isEmail().withMessage('Valid user email is required'),
  body('plan').isString().withMessage('Plan is required'),
  body('nick').optional().isString().withMessage('Nick must be a string'),
  body('authorizedBy').optional().isEmail().withMessage('Authorized by must be a valid email'),
  validationMiddleware
], securityController.createSubscription);

/**
 * GET /security/subscriptions/:email
 * Get subscription details (requires authentication and ownership or admin)
 */
router.get('/subscriptions/:email', [
  authMiddleware,
  resourceOwnerMiddleware('email'),
  param('email').isEmail().withMessage('Valid email is required'),
  validationMiddleware
], securityController.getSubscription);

/**
 * POST /security/subscriptions/:email/cancel
 * Cancel subscription (requires admin role)
 */
router.post('/subscriptions/:email/cancel', [
  authMiddleware,
  adminMiddleware,
  param('email').isEmail().withMessage('Valid email is required'),
  validationMiddleware
], securityController.cancelSubscription);

// ========== PLAN MANAGEMENT ENDPOINTS ==========

/**
 * GET /security/plans
 * Get all available plans (public endpoint)
 */
router.get('/plans', securityController.getPlans);

/**
 * POST /security/plans
 * Create or update plan (requires admin role)
 */
router.post('/plans', [
  authMiddleware,
  adminMiddleware,
  body('planId').isString().withMessage('Plan ID is required'),
  body('name').isString().withMessage('Plan name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('limits').optional().isObject().withMessage('Limits must be an object'),
  validationMiddleware
], securityController.createPlan);

// ========== USER GROUP ENDPOINTS ==========

/**
 * GET /security/groups
 * Get all user groups (requires authentication)
 */
router.get('/groups', authMiddleware, securityController.getUserGroups);

/**
 * POST /security/groups
 * Create user group (requires admin role)
 */
router.post('/groups', [
  authMiddleware,
  adminMiddleware,
  body('groupName').isString().withMessage('Group name is required'),
  body('users').optional().isArray().withMessage('Users must be an array'),
  body('users.*').optional().isEmail().withMessage('All users must have valid emails'),
  validationMiddleware
], securityController.createUserGroup);

// ========== USER ROLE ENDPOINTS ==========

/**
 * POST /security/roles/set
 * Set user role (requires admin role)
 */
router.post('/roles/set', [
  authMiddleware,
  adminMiddleware,
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['default', 'admin']).withMessage('Role must be default or admin'),
  validationMiddleware
], securityController.setUserRole);

// ========== HEALTH CHECK ==========

/**
 * GET /security/health
 * Health check endpoint (public)
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Security module is healthy',
    data: {
      service: 'neuron-core-security',
      timestamp: new Date().toISOString(),
      aiName: req.aiName || 'unknown',
      version: '1.0.0'
    }
  });
});

// ========== USER INFO ==========

/**
 * GET /security/me
 * Get current user info (requires authentication)
 */
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'User info retrieved successfully',
    data: {
      email: req.user.email,
      permissions: req.user.permissions,
      isAdmin: req.user.isAdmin || false,
      aiName: req.aiName
    }
  });
});

module.exports = router;