// src/api/security/routes.js

const express = require('express');
const AuthController = require('./auth_controller');
const PermissionController = require('./permission_controller');
const SubscriptionController = require('./subscription_controller');

const router = express.Router({ mergeParams: true });

// Initialize controllers
const authController = new AuthController();
const permissionController = new PermissionController();
const subscriptionController = new SubscriptionController();

// Authentication routes
router.post('/login', (req, res) => authController.login(req, res));
router.get('/validate', (req, res) => authController.validate(req, res));
router.post('/change-password', (req, res) => authController.changePassword(req, res));
router.post('/create-user', (req, res) => authController.createUser(req, res));

// Permission routes
router.get('/permissions', (req, res) => authController.getPermissions(req, res));
router.post('/permissions/set', (req, res) => authController.setPermission(req, res));

// Group management routes
router.get('/groups', (req, res) => permissionController.listGroups(req, res));
router.post('/groups/create', (req, res) => permissionController.createGroup(req, res));
router.post('/groups/add-user', (req, res) => permissionController.addUserToGroup(req, res));
router.post('/groups/remove-user', (req, res) => permissionController.removeUserFromGroup(req, res));
router.get('/groups/:groupName/members', (req, res) => permissionController.getGroupMembers(req, res));

// Role management routes
router.get('/roles', (req, res) => permissionController.getUserGroups(req, res));
router.post('/roles/set', (req, res) => permissionController.setUserRole(req, res));

// Subscription and plan routes
router.get('/plans', (req, res) => subscriptionController.getPlans(req, res));
router.get('/plans/:planId', (req, res) => subscriptionController.getPlan(req, res));
router.post('/subscription/create', (req, res) => subscriptionController.createSubscription(req, res));
router.post('/subscription/change-plan', (req, res) => subscriptionController.changePlan(req, res));
router.post('/subscription/cancel', (req, res) => subscriptionController.cancelPlan(req, res));
router.post('/subscription/add-user', (req, res) => subscriptionController.addUserToSubscription(req, res));

module.exports = router;