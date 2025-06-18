// src/data/managers/permission.manager.js
const neuronDBSender = require('../sender/neurondb.sender');
const PermissionDTO = require('../../cross/entities/permission.dto');

class PermissionManager {
  async getUserPermissions(token) {
    try {
      const result = await neuronDBSender.validateToken(token);

      if (!result || !result.permissions) {
        return [];
      }

      return PermissionDTO.fromNeuronDB(result.permissions);
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  }

  async hasPermission(token, database, requiredLevel) {
    try {
      const permissions = await this.getUserPermissions(token);
      const permission = permissions.find(p => p.database === database);

      return permission && permission.level >= requiredLevel;
    } catch (error) {
      return false;
    }
  }

  async isAdmin(token, database = 'main') {
    return this.hasPermission(token, database, 3);
  }

  async canWrite(token, database) {
    return this.hasPermission(token, database, 2);
  }

  async canRead(token, database) {
    return this.hasPermission(token, database, 1);
  }
}

module.exports = new PermissionManager();