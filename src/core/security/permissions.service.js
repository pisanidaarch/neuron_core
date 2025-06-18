// src/core/security/permissions.service.js
const permissionManager = require('../../data/managers/permission.manager');
const userManager = require('../../data/managers/user.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS, PERMISSIONS } = require('../../cross/constants');

class PermissionsService {
  async getPermissions(token) {
    try {
      const permissions = await permissionManager.getUserPermissions(token);
      return permissions.map(p => p.toJSON());
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  }

  async setPermission(aiName, email, database, level, adminToken) {
    try {
      // Verify admin permissions
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      // Validate level
      if (!Object.values(PERMISSIONS).includes(level)) {
        throw new Error('Invalid permission level');
      }

      return await userManager.setPermission(aiName, email, database, level);
    } catch (error) {
      throw new Error(`Failed to set permission: ${error.message}`);
    }
  }

  async checkPermission(token, database, requiredLevel) {
    try {
      return await permissionManager.hasPermission(token, database, requiredLevel);
    } catch (error) {
      return false;
    }
  }

  async validateAdminAccess(token, aiName) {
    try {
      // Check if user is admin
      const isAdmin = await permissionManager.isAdmin(token);
      if (!isAdmin) {
        return false;
      }

      // Also check user role
      const tokenData = await permissionManager.getUserPermissions(token);
      if (tokenData.length === 0) {
        return false;
      }

      const userRole = await userManager.getUserRole(tokenData[0].email, aiName);
      return userRole && userRole.role === 'admin';
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PermissionsService();