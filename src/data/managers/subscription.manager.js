// src/data/managers/subscription.manager.js
const neuronDBSender = require('../sender/neurondb.sender');
const snlCommands = require('../snl/commands');
const SubscriptionDTO = require('../../cross/entities/subscription.dto');
const userManager = require('./user.manager');
const planManager = require('./plan.manager');

class SubscriptionManager {
  async createSubscription(subscriptionData, systemToken) {
    try {
      const subscriptionDTO = new SubscriptionDTO(subscriptionData);

      // Generate random password if not provided
      if (!subscriptionData.password) {
        subscriptionData.password = this.generateRandomPassword();
      }

      // Create user
      await userManager.createUser(subscriptionData.aiName, {
        email: subscriptionDTO.userEmail,
        password: subscriptionData.password,
        nick: subscriptionData.nick || subscriptionDTO.userEmail.split('@')[0]
      });

      // Set user plan
      await planManager.setUserPlan(
        subscriptionDTO.userEmail,
        subscriptionDTO.plan,
        systemToken
      );

      // Create subscription record
      const snlCommand = snl.subscription.set(
        subscriptionDTO.userEmail,
        subscriptionDTO.toStructure()
      );

      await neuronDBSender.executeSNL(snlCommand, systemToken);

      return {
        subscription: subscriptionDTO,
        password: subscriptionData.password
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async getSubscription(email, systemToken) {
    try {
      const snlCommand = snl.subscription.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);

      if (!result || !result[email]) return null;

      return SubscriptionDTO.fromStructure(email, result[email]);
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async updateSubscription(email, updates, systemToken) {
    try {
      const current = await this.getSubscription(email, systemToken);
      if (!current) throw new Error('Subscription not found');

      const updated = new SubscriptionDTO({
        ...current,
        ...updates
      });

      const snlCommand = snl.subscription.set(email, updated.toStructure());
      await neuronDBSender.executeSNL(snlCommand, systemToken);

      // Update user plan if changed
      if (updates.plan && updates.plan !== current.plan) {
        await planManager.setUserPlan(email, updates.plan, systemToken);
      }

      return updated;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(email, systemToken) {
    try {
      return await this.updateSubscription(
        email,
        { status: 'cancelled' },
        systemToken
      );
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }
}

module.exports = new SubscriptionManager();