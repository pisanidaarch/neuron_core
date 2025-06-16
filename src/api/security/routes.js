// src/api/security/routes.js

const express = require('express');
const AuthController = require('./controllers/auth_controller');
const PermissionController = require('./controllers/permission_controller');
const SubscriptionController = require('./controllers/subscription_controller');
const UserController = require('./controllers/user_controller');
const { ErrorHandler } = require('../../cross/entity/errors');

const router = express.Router();

// Initialize controllers
const authController = new AuthController();
const permissionController = new PermissionController();
const subscriptionController = new SubscriptionController();
const userController = new UserController();

// Authentication routes
router.post('/:aiName/auth/login', ErrorHandler.asyncWrapper(authController.login.bind(authController)));
router.post('/:aiName/auth/validate', ErrorHandler.asyncWrapper(authController.validateToken.bind(authController)));
router.post('/:aiName/auth/change-password', ErrorHandler.asyncWrapper(authController.changePassword.bind(authController)));
router.post('/:aiName/auth/logout', ErrorHandler.asyncWrapper(authController.logout.bind(authController)));
router.post('/:aiName/auth/refresh', ErrorHandler.asyncWrapper(authController.refreshToken.bind(authController)));
router.get('/:aiName/auth/me', ErrorHandler.asyncWrapper(authController.getCurrentUser.bind(authController)));

// Permission routes
router.get('/:aiName/permissions/groups', ErrorHandler.asyncWrapper(permissionController.listGroups.bind(permissionController)));
router.get('/:aiName/permissions/validate', ErrorHandler.asyncWrapper(permissionController.validatePermissions.bind(permissionController)));
router.get('/:aiName/permissions/users/:username', ErrorHandler.asyncWrapper(permissionController.getUserPermissions.bind(permissionController)));

// User management routes
router.post('/:aiName/users/create', ErrorHandler.asyncWrapper(userController.createUser.bind(userController)));
router.get('/:aiName/users/:username', ErrorHandler.asyncWrapper(userController.getUser.bind(userController)));
router.put('/:aiName/users/:username', ErrorHandler.asyncWrapper(userController.updateUser.bind(userController)));
router.delete('/:aiName/users/:username', ErrorHandler.asyncWrapper(userController.deleteUser.bind(userController)));
router.get('/:aiName/users', ErrorHandler.asyncWrapper(userController.listUsers.bind(userController)));

// Subscription routes
router.get('/:aiName/subscriptions/plans', ErrorHandler.asyncWrapper(subscriptionController.getPlans.bind(subscriptionController)));
router.get('/:aiName/subscriptions/plan', ErrorHandler.asyncWrapper(subscriptionController.getCurrentPlan.bind(subscriptionController)));
router.post('/:aiName/subscriptions/change-plan', ErrorHandler.asyncWrapper(subscriptionController.changePlan.bind(subscriptionController)));
router.post('/:aiName/subscriptions/cancel', ErrorHandler.asyncWrapper(subscriptionController.cancelPlan.bind(subscriptionController)));
router.get('/:aiName/subscriptions/usage', ErrorHandler.asyncWrapper(subscriptionController.getUsage.bind(subscriptionController)));
router.get('/:aiName/subscriptions/billing', ErrorHandler.asyncWrapper(subscriptionController.getBillingHistory.bind(subscriptionController)));

module.exports = router;