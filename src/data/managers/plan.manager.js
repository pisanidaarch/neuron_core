// src/data/managers/plan.manager.js
const neuronDBSender = require('../sender/neurondb.sender');
const snl = require('../snl');
const PlanDTO = require('../../cross/entities/plan.dto');

class PlanManager {
  async getAllPlans(systemToken) {
    try {
      const snlCommand = snl.plans.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);

      if (!result) return [];

      return Object.entries(result).map(([id, data]) =>
        PlanDTO.fromStructure(id, data)
      );
    } catch (error) {
      throw new Error(`Failed to get plans: ${error.message}`);
    }
  }

  async getPlan(planId, systemToken) {
    try {
      const plans = await this.getAllPlans(systemToken);
      return plans.find(p => p.id === planId) || null;
    } catch (error) {
      throw new Error(`Failed to get plan: ${error.message}`);
    }
  }

  async createOrUpdatePlan(planId, planData, systemToken) {
    try {
      const planDTO = new PlanDTO({ id: planId, ...planData });
      const snlCommand = snl.plans.set(planId, planDTO.toStructure());

      await neuronDBSender.executeSNL(snlCommand, systemToken);

      // Also set plan limits if provided
      if (planData.limits) {
        const limitsSnl = snl.planlimits.set(planId, planData.limits);
        await neuronDBSender.executeSNL(limitsSnl, systemToken);
      }

      return planDTO;
    } catch (error) {
      throw new Error(`Failed to create/update plan: ${error.message}`);
    }
  }

  async removePlan(planId, systemToken) {
    try {
      const snlCommand = snl.plans.remove(planId);
      return await neuronDBSender.executeSNL(snlCommand, systemToken);
    } catch (error) {
      throw new Error(`Failed to remove plan: ${error.message}`);
    }
  }

  async getPlanLimits(planId, systemToken) {
    try {
      const snlCommand = snl.planlimits.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);
      return result[planId] || null;
    } catch (error) {
      throw new Error(`Failed to get plan limits: ${error.message}`);
    }
  }

  async setUserPlan(email, planId, systemToken) {
    try {
      const snlCommand = snl.usersplans.set(email, planId);
      return await neuronDBSender.executeSNL(snlCommand, systemToken);
    } catch (error) {
      throw new Error(`Failed to set user plan: ${error.message}`);
    }
  }
}

module.exports = new PlanManager();