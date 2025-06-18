// src/api/routes/security.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const authenticationService = require('../../core/security/authentication.service');
const permissionsService = require('../../core/security/permissions.service');
const groupsService = require('../../core/security/groups.service');
const plansService = require('../../core/security/plans.service');
const subscriptionService = require('../../core/security/subscription.service');

// Authentication routes
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required');
    }

    const result = await authenticationService.login(email, password);
    res.success(result);
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.error('New password is required');
    }

    await authenticationService.changePassword(req.token, newPassword);
    res.success(null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/create-user', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { email, password, nick, role } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required');
    }

    const result = await authenticationService.createUser(
      req.aiName,
      { email, password, nick, role },
      req.token
    );

    res.success(result, 'User created successfully');
  } catch (error) {
    next(error);
  }
});

// Permissions routes
router.get('/permissions', authMiddleware, async (req, res, next) => {
  try {
    const permissions = await permissionsService.getPermissions(req.token);
    res.success(permissions);
  } catch (error) {
    next(error);
  }
});

router.post('/permissions', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { email, database, level } = req.body;

    if (!email || !database || !level) {
      return res.error('Email, database, and level are required');
    }

    await permissionsService.setPermission(
      req.aiName,
      email,
      database,
      level,
      req.token
    );

    res.success(null, 'Permission set successfully');
  } catch (error) {
    next(error);
  }
});

// Groups routes
router.get('/groups', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const groups = await groupsService.getAllGroups(req.aiName, req.token);
    res.success(groups);
  } catch (error) {
    next(error);
  }
});

router.post('/groups', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.error('Group name is required');
    }

    const group = await groupsService.createGroup(req.aiName, name, req.token);
    res.success(group, 'Group created successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/groups/:groupName/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { groupName } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.error('User email is required');
    }

    const group = await groupsService.addUserToGroup(
      req.aiName,
      groupName,
      email,
      req.token
    );

    res.success(group, 'User added to group');
  } catch (error) {
    next(error);
  }
});

router.delete('/groups/:groupName/users/:email', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { groupName, email } = req.params;

    const group = await groupsService.removeUserFromGroup(
      req.aiName,
      groupName,
      email,
      req.token
    );

    res.success(group, 'User removed from group');
  } catch (error) {
    next(error);
  }
});

// Plans routes
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await plansService.getAllPlans(req.aiName);
    res.success(plans);
  } catch (error) {
    next(error);
  }
});

router.get('/plans/:planId', async (req, res, next) => {
  try {
    const { planId } = req.params;
    const plan = await plansService.getPlan(req.aiName, planId);
    res.success(plan);
  } catch (error) {
    next(error);
  }
});

router.post('/plans', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const planData = req.body;

    if (!planData.id || !planData.name || planData.price === undefined) {
      return res.error('Plan id, name, and price are required');
    }

    const plan = await plansService.createPlan(req.aiName, planData, req.token);
    res.success(plan, 'Plan created successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/plans/:planId', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.params;
    const planData = req.body;

    const plan = await plansService.updatePlan(
      req.aiName,
      planId,
      planData,
      req.token
    );

    res.success(plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/plans/:planId', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.params;

    await plansService.deletePlan(req.aiName, planId, req.token);
    res.success(null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
});

// Subscription routes
router.post('/subscriptions', async (req, res, next) => {
  try {
    const subscriptionData = req.body;

    if (!subscriptionData.userEmail || !subscriptionData.plan) {
      return res.error('User email and plan are required');
    }

    const result = await subscriptionService.createSubscription(
      req.aiName,
      subscriptionData
    );

    res.success(result, 'Subscription created successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/subscriptions/:email', authMiddleware, async (req, res, next) => {
  try {
    const { email } = req.params;

    const subscription = await subscriptionService.getSubscription(
      req.aiName,
      email,
      req.token
    );

    res.success(subscription);
  } catch (error) {
    next(error);
  }
});

router.put('/subscriptions/:email', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    const subscription = await subscriptionService.updateSubscription(
      req.aiName,
      email,
      updates,
      req.token
    );

    res.success(subscription, 'Subscription updated successfully');
  } catch (error) {
    next(error);
  }
});

router.post('/subscriptions/:email/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { email } = req.params;

    const subscription = await subscriptionService.cancelSubscription(
      req.aiName,
      email,
      req.token
    );

    res.success(subscription, 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;