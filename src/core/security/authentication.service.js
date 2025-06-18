// src/core/security/authentication.service.js
const neuronDBSender = require('../../data/sender/neurondb.sender');
const userManager = require('../../data/managers/user.manager');
const permissionManager = require('../../data/managers/permission.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class AuthenticationService {
  async login(email, password) {
    try {
      const result = await neuronDBSender.login(email, password);

      if (!result || !result.token) {
        throw new Error('Invalid credentials');
      }

      // Get user permissions
      const permissions = await permissionManager.getUserPermissions(result.token);

      return {
        token: result.token,
        email: result.sub || email,
        permissions: permissions.map(p => p.toJSON())
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async changePassword(token, newPassword) {
    try {
      return await neuronDBSender.changePassword(newPassword, token);
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async validateToken(token) {
    try {
      const result = await neuronDBSender.validateToken(token);

      if (!result) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }

      return {
        valid: true,
        email: result.sub,
        permissions: result.permissions
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async createUser(aiName, userData, adminToken) {
    try {
      // Verify admin permissions
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      return await userManager.createUser(aiName, userData);
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  async getUserRole(email, aiName) {
    try {
      const aiKeys = ConfigVO.get('AI_KEYS');
      if (!aiKeys || !aiKeys.hasAI(aiName)) {
        throw new Error(ERRORS.INVALID_AI);
      }

      const systemToken = aiKeys.getToken(aiName);
      return await userManager.getUserRole(email, systemToken);
    } catch (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async setUserRole(email, role, aiName, adminToken) {
    try {
      // Verify admin permissions
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const aiKeys = ConfigVO.get('AI_KEYS');
      if (!aiKeys || !aiKeys.hasAI(aiName)) {
        throw new Error(ERRORS.INVALID_AI);
      }

      const systemToken = aiKeys.getToken(aiName);
      return await userManager.setUserRole(email, role, systemToken);
    } catch (error) {
      throw new Error(`Failed to set user role: ${error.message}`);
    }
  }
}

module.exports = new AuthenticationService();