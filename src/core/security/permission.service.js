// src/core/security/permission.service.js
const neuronDBSender = require('../../data/sender/neurondb.sender');
const userManager = require('../../data/managers/user.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS, PERMISSIONS } = require('../../cross/constants');

class PermissionService {
  async getPermissions(aiName, userToken) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      const result = await neuronDBSender.validateToken(userToken, aiToken);

      if (!result || !result.permissions) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }

      return this.formatPermissions(result.permissions);
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  }

  async setPermission(aiName, email, database, level) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      // Validate permission level
      if (![1, 2, 3].includes(level)) {
        throw new Error('Invalid permission level. Must be 1 (read-only), 2 (read-write), or 3 (admin)');
      }

      return await neuronDBSender.setPermission(email, database, level, aiToken);
    } catch (error) {
      throw new Error(`Failed to set permission: ${error.message}`);
    }
  }

  async isAdmin(aiName, userToken) {
    try {
      const permissions = await this.getPermissions(aiName, userToken);

      // Check if user has admin level (3) on any database
      return permissions.some(p => p.level === PERMISSIONS.ADMIN);
    } catch (error) {
      return false;
    }
  }

  async hasPermission(aiName, userToken, database, requiredLevel) {
    try {
      const permissions = await this.getPermissions(aiName, userToken);

      const dbPermission = permissions.find(p => p.database === database);
      if (!dbPermission) {
        return false;
      }

      return dbPermission.level >= requiredLevel;
    } catch (error) {
      return false;
    }
  }

  async getUserRole(aiName, email) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      return await userManager.getUserRole(email, aiToken);
    } catch (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async setUserRole(aiName, email, role) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      return await userManager.setUserRole(email, role, aiToken);
    } catch (error) {
      throw new Error(`Failed to set user role: ${error.message}`);
    }
  }

  formatPermissions(permissionsData) {
    if (!permissionsData || typeof permissionsData !== 'object') {
      return [];
    }

    return Object.entries(permissionsData).map(([database, level]) => ({
      database,
      level,
      levelName: this.getLevelName(level)
    }));
  }

  getLevelName(level) {
    switch (level) {
      case 1: return 'read-only';
      case 2: return 'read-write';
      case 3: return 'admin';
      default: return 'unknown';
    }
  }
}

module.exports = new PermissionService();