// src/core/security/security.service.js
const userManager = require('../../data/managers/user.manager');
const planManager = require('../../data/managers/plan.manager');
const permissionService = require('./permission.service');
const ConfigVO = require('../../cross/entities/config.vo');
const snl = require('../../data/snl');
const neuronDBSender = require('../../data/sender/neurondb.sender');
const { ERRORS, DEFAULT_PLANS } = require('../../cross/constants');

class SecurityService {
  // ========== USER MANAGEMENT ==========

  async createUser(aiName, userData, systemToken) {
    try {
      const result = await userManager.createUser(aiName, userData);

      // Set default role
      await userManager.setUserRole(
        userData.email,
        userData.role || 'default',
        systemToken
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async setUserRole(email, role) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await userManager.setUserRole(email, role, aiToken);
    } catch (error) {
      throw new Error(`Failed to set user role: ${error.message}`);
    }
  }

  // ========== PLAN MANAGEMENT ==========

  async getPlans() {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        // Return default plans if no AI configured
        return Object.values(DEFAULT_PLANS);
      }

      const aiToken = config.getAIToken(aiList[0]);
      const plans = await planManager.getAllPlans(aiToken);

      // If no plans in database, return defaults
      if (!plans || plans.length === 0) {
        return Object.values(DEFAULT_PLANS);
      }

      return plans;
    } catch (error) {
      // Fallback to default plans on error
      console.warn('Failed to get plans from database, using defaults:', error.message);
      return Object.values(DEFAULT_PLANS);
    }
  }

  async getPlan(planId) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await planManager.getPlan(planId, aiToken);
    } catch (error) {
      throw new Error(`Failed to get plan: ${error.message}`);
    }
  }

  async createOrUpdatePlan(planId, planData) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      return await planManager.createOrUpdatePlan(planId, planData, aiToken);
    } catch (error) {
      throw new Error(`Failed to create/update plan: ${error.message}`);
    }
  }

  // ========== USER GROUPS ==========

  async getUserGroups() {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      const snlCommand = snl.usergroups.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, aiToken);

      if (!result) return [];

      return Object.entries(result).map(([groupName, data]) => ({
        name: groupName,
        users: data.users || []
      }));
    } catch (error) {
      throw new Error(`Failed to get user groups: ${error.message}`);
    }
  }

  async createUserGroup(groupName, users = []) {
    try {
      const config = new ConfigVO();
      const aiList = config.getAllAIs();

      if (aiList.length === 0) {
        throw new Error('No AI configurations available');
      }

      const aiToken = config.getAIToken(aiList[0]);
      const snlCommand = snl.usergroups.set(groupName, users);
      await neuronDBSender.executeSNL(snlCommand, aiToken);

      return {
        name: groupName,
        users
      };
    } catch (error) {
      throw new Error(`Failed to create user group: ${error.message}`);
    }
  }

  async addUserToGroup(groupName, email) {
    try {
      // Get current group
      const groups = await this.getUserGroups();
      const group = groups.find(g => g.name === groupName);

      if (!group) {
        throw new Error('Group not found');
      }

      if (group.users.includes(email)) {
        throw new Error('User already in group');
      }

      // Add user and update
      const newUsers = [...group.users, email];
      return await this.createUserGroup(groupName, newUsers);
    } catch (error) {
      throw new Error(`Failed to add user to group: ${error.message}`);
    }
  }

  async removeUserFromGroup(groupName, email) {
    try {
      // Get current group
      const groups = await this.getUserGroups();
      const group = groups.find(g => g.name === groupName);

      if (!group) {
        throw new Error('Group not found');
      }

      // Remove user and update
      const newUsers = group.users.filter(u => u !== email);
      return await this.createUserGroup(groupName, newUsers);
    } catch (error) {
      throw new Error(`Failed to remove user from group: ${error.message}`);
    }
  }

  // ========== VALIDATION HELPERS ==========

  async validateAdminRole(aiName, userToken) {
    try {
      return await permissionService.isAdmin(aiName, userToken);
    } catch (error) {
      return false;
    }
  }

  async validateUserPermission(aiName, userToken, database, requiredLevel) {
    try {
      return await permissionService.hasPermission(aiName, userToken, database, requiredLevel);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SecurityService();