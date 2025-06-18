// src/core/security/subscription.service.js
const subscriptionManager = require('../../data/managers/subscription.manager');
const permissionService = require('./permission.service');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class SubscriptionService {
  async createSubscription(subscriptionData) {
    try {
      // This endpoint is used by payment integration
      // Must be authorized by the configured admin email

      const config = new ConfigVO();
      const aiToken = config.getAIToken(subscriptionData.aiName);

      if (!aiToken) {
        throw new Error(`AI ${subscriptionData.aiName} not configured`);
      }

      const result = await subscriptionManager.createSubscription(
        subscriptionData,
        aiToken
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

  async getSubscription(email) {
    try {
      // For now, we'll get the first available AI token
      // In a real scenario, this might be based on context
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await subscriptionManager.getSubscription(email, aiToken);
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async updateSubscription(email, updates) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await subscriptionManager.updateSubscription(email, updates, aiToken);
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(email) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await subscriptionManager.cancelSubscription(email, aiToken);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async validateUserAccess(aiName, token, targetEmail) {
    try {
      const validation = await permissionService.getPermissions(aiName, token);

      if (!validation || validation.length === 0) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }

      // For now, allow access - in production you'd check if user owns the subscription
      // or has admin privileges
      return true;
    } catch (error) {
      throw new Error(`Access validation failed: ${error.message}`);
    }
  }

  async validateAdminAccess(aiName, token) {
    try {
      return await permissionService.isAdmin(aiName, token);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SubscriptionService();