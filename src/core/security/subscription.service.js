// src/core/security/subscription.service.js
const subscriptionManager = require('../../data/managers/subscription.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class SubscriptionService {
  async createSubscription(aiName, subscriptionData) {
    try {
      // This should only be called by the payment integration
      // using the admin email configured in the system
      const adminEmail = ConfigVO.ADMIN_EMAIL;

      if (!subscriptionData.authorizedBy ||
          subscriptionData.authorizedBy !== adminEmail) {
        throw new Error('Unauthorized subscription creation');
      }

      const systemToken = this.getSystemToken(aiName);
      subscriptionData.aiName = aiName;

      const result = await subscriptionManager.createSubscription(
        subscriptionData,
        systemToken
      );

      return {
        subscription: result.subscription,
        credentials: {
          email: result.subscription.userEmail,
          password: result.password
        }
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async getSubscription(aiName, email, token) {
    try {
      // User can only view their own subscription
      const tokenData = await this.validateUserAccess(token, email);

      const systemToken = this.getSystemToken(aiName);
      return await subscriptionManager.getSubscription(email, systemToken);
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async updateSubscription(aiName, email, updates, adminToken) {
    try {
      // Only admins can update subscriptions
      const isAdmin = await this.validateAdminAccess(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      return await subscriptionManager.updateSubscription(
        email,
        updates,
        systemToken
      );
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(aiName, email, token) {
    try {
      // User can cancel their own subscription or admin can cancel any
      await this.validateUserAccess(token, email);

      const systemToken = this.getSystemToken(aiName);
      return await subscriptionManager.cancelSubscription(email, systemToken);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async validateUserAccess(token, targetEmail) {
    const neuronDBSender = require('../../data/sender/neurondb.sender');
    const result = await neuronDBSender.validateToken(token);

    if (!result || !result.sub) {
      throw new Error(ERRORS.INVALID_TOKEN);
    }

    // Check if user is accessing their own data or is admin
    if (result.sub !== targetEmail) {
      const permissionManager = require('../../data/managers/permission.manager');
      const isAdmin = await permissionManager.isAdmin(token);
      if (!isAdmin) {
        throw new Error(ERRORS.UNAUTHORIZED);
      }
    }

    return result;
  }

  async validateAdminAccess(token) {
    const permissionManager = require('../../data/managers/permission.manager');
    return await permissionManager.isAdmin(token);
  }

  getSystemToken(aiName) {
    const aiKeys = ConfigVO.get('AI_KEYS');
    if (!aiKeys || !aiKeys.hasAI(aiName)) {
      throw new Error(ERRORS.INVALID_AI);
    }
    return aiKeys.getToken(aiName);
  }
}

module.exports = new SubscriptionService();