// src/api/controllers/security.controller.js
const securityService = require('../../core/security/security.service');
const authenticationService = require('../../core/security/authentication.service');
const permissionService = require('../../core/security/permission.service');
const subscriptionService = require('../../core/security/subscription.service');
const { ROLES, PERMISSIONS } = require('../../cross/constants');

class SecurityController {
  // ========== AUTHENTICATION ==========

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { aiName } = req;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          data: null
        });
      }

      const result = await authenticationService.login(aiName, email, password);

      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        error: error.message,
        data: null
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { newPassword } = req.body;
      const { aiName } = req;
      const authHeader = req.headers.authorization;

      if (!newPassword) {
        return res.status(400).json({
          error: 'New password is required',
          data: null
        });
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const token = authHeader.substring(7);
      const result = await authenticationService.changePassword(aiName, token, newPassword);

      res.status(200).json({
        message: 'Password changed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async getPermissions(req, res) {
    try {
      const { aiName } = req;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const token = authHeader.substring(7);
      const permissions = await permissionService.getPermissions(aiName, token);

      res.status(200).json({
        message: 'Permissions retrieved successfully',
        data: permissions
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== USER MANAGEMENT ==========

  async createUser(req, res) {
    try {
      const { email, password, nick, role = ROLES.DEFAULT } = req.body;
      const { aiName, aiToken } = req;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const userToken = authHeader.substring(7);
        const isAdmin = await this.verifyAdminRole(aiName, userToken);
        if (!isAdmin) {
          return res.status(403).json({
            error: 'Admin privileges required',
            data: null
          });
        }
      }

      const userData = {
        email,
        password,
        nick: nick || email.split('@')[0],
        role
      };

      const result = await securityService.createUser(aiName, userData, aiToken);

      res.status(201).json({
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async setPermission(req, res) {
    try {
      const { email, database, level } = req.body;
      const { aiName } = req;

      if (!email || !database || level === undefined) {
        return res.status(400).json({
          error: 'Email, database, and level are required',
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const userToken = authHeader.substring(7);
      const isAdmin = await this.verifyAdminRole(aiName, userToken);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin privileges required',
          data: null
        });
      }

      const result = await permissionService.setPermission(aiName, email, database, level);

      res.status(200).json({
        message: 'Permission set successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== SUBSCRIPTION MANAGEMENT ==========

  async createSubscription(req, res) {
    try {
      const { userEmail, plan, nick, authorizedBy } = req.body;
      const { aiName } = req;

      if (!userEmail || !plan) {
        return res.status(400).json({
          error: 'User email and plan are required',
          data: null
        });
      }

      const subscriptionData = {
        userEmail,
        plan,
        nick,
        authorizedBy,
        aiName
      };

      const result = await subscriptionService.createSubscription(subscriptionData);

      res.status(201).json({
        message: 'Subscription created successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async getSubscription(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          error: 'Email parameter is required',
          data: null
        });
      }

      const subscription = await subscriptionService.getSubscription(email);

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          data: null
        });
      }

      res.status(200).json({
        message: 'Subscription retrieved successfully',
        data: subscription
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async cancelSubscription(req, res) {
    try {
      const { email } = req.params;
      const { aiName } = req;

      if (!email) {
        return res.status(400).json({
          error: 'Email parameter is required',
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const userToken = authHeader.substring(7);
      const isAdmin = await this.verifyAdminRole(aiName, userToken);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin privileges required',
          data: null
        });
      }

      const result = await subscriptionService.cancelSubscription(email);

      res.status(200).json({
        message: 'Subscription cancelled successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== PLAN MANAGEMENT ==========

  async getPlans(req, res) {
    try {
      const plans = await securityService.getPlans();

      res.status(200).json({
        message: 'Plans retrieved successfully',
        data: plans
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async createPlan(req, res) {
    try {
      const { planId, name, price, limits } = req.body;
      const { aiName } = req;

      if (!planId || !name || price === undefined) {
        return res.status(400).json({
          error: 'Plan ID, name, and price are required',
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const userToken = authHeader.substring(7);
      const isAdmin = await this.verifyAdminRole(aiName, userToken);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin privileges required',
          data: null
        });
      }

      const planData = { name, price, limits };
      const result = await securityService.createOrUpdatePlan(planId, planData);

      res.status(201).json({
        message: 'Plan created successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== USER GROUP MANAGEMENT ==========

  async getUserGroups(req, res) {
    try {
      const groups = await securityService.getUserGroups();

      res.status(200).json({
        message: 'User groups retrieved successfully',
        data: groups
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  async createUserGroup(req, res) {
    try {
      const { groupName, users = [] } = req.body;
      const { aiName } = req;

      if (!groupName) {
        return res.status(400).json({
          error: 'Group name is required',
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const userToken = authHeader.substring(7);
      const isAdmin = await this.verifyAdminRole(aiName, userToken);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin privileges required',
          data: null
        });
      }

      const result = await securityService.createUserGroup(groupName, users);

      res.status(201).json({
        message: 'User group created successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== USER ROLE MANAGEMENT ==========

  async setUserRole(req, res) {
    try {
      const { email, role } = req.body;
      const { aiName } = req;

      if (!email || !role) {
        return res.status(400).json({
          error: 'Email and role are required',
          data: null
        });
      }

      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`,
          data: null
        });
      }

      // Verify admin permissions
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization token required',
          data: null
        });
      }

      const userToken = authHeader.substring(7);
      const isAdmin = await this.verifyAdminRole(aiName, userToken);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin privileges required',
          data: null
        });
      }

      const result = await securityService.setUserRole(email, role);

      res.status(200).json({
        message: 'User role set successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        data: null
      });
    }
  }

  // ========== HELPER METHODS ==========

  async verifyAdminRole(aiName, userToken) {
    try {
      return await permissionService.isAdmin(aiName, userToken);
    } catch (error) {
      console.error('Admin verification error:', error);
      return false;
    }
  }
}

module.exports = new SecurityController();