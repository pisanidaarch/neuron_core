// src/core/security/plans.service.js
const planManager = require('../../data/managers/plan.manager');
const permissionManager = require('../../data/managers/permission.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class PlansService {
  async getAllPlans(aiName) {
    try {
      const systemToken = this.getSystemToken(aiName);
      return await planManager.getAllPlans(systemToken);
    } catch (error) {
      throw new Error(`Failed to get plans: ${error.message}`);
    }
  }

  async getPlan(aiName, planId) {
    try {
      const systemToken = this.getSystemToken(aiName);
      const plan = await planManager.getPlan(planId, systemToken);

      if (!plan) {
        throw new Error(ERRORS.PLAN_NOT_FOUND);
      }

      // Get plan limits
      const limits = await planManager.getPlanLimits(planId, systemToken);
      if (limits) {
        plan.limits = limits;
      }

      return plan;
    } catch (error) {
      throw new Error(`Failed to get plan: ${error.message}`);
    }
  }

  async createPlan(aiName, planData, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      return await planManager.createOrUpdatePlan(
        planData.id,
        planData,
        systemToken
      );
    } catch (error) {
      throw new Error(`Failed to create plan: ${error.message}`);
    }
  }

  async updatePlan(aiName, planId, planData, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      return await planManager.createOrUpdatePlan(planId, planData, systemToken);
    } catch (error) {
      throw new Error(`Failed to update plan: ${error.message}`);
    }
  }

  async deletePlan(aiName, planId, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      return await planManager.removePlan(planId, systemToken);
    } catch (error) {
      throw new Error(`Failed to delete plan: ${error.message}`);
    }
  }

  async assignUserToPlan(aiName, email, planId, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);

      // Verify plan exists
      const plan = await planManager.getPlan(planId, systemToken);
      if (!plan) {
        throw new Error(ERRORS.PLAN_NOT_FOUND);
      }

      return await planManager.setUserPlan(email, planId, systemToken);
    } catch (error) {
      throw new Error(`Failed to assign user to plan: ${error.message}`);
    }
  }

  getSystemToken(aiName) {
    const aiKeys = ConfigVO.get('AI_KEYS');
    if (!aiKeys || !aiKeys.hasAI(aiName)) {
      throw new Error(ERRORS.INVALID_AI);
    }
    return aiKeys.getToken(aiName);
  }
}

module.exports = new PlansService();