// src/core/security/authentication.service.js
const neuronDBSender = require('../../data/sender/neurondb.sender');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class AuthenticationService {
  async login(aiName, email, password) {
    try {
      // Get AI token for this tenant
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      // Perform login using NeuronDB
      const loginData = { email, password };
      const result = await neuronDBSender.login(loginData, aiToken);

      if (!result || !result.token) {
        throw new Error('Invalid credentials');
      }

      // Get user permissions
      const permissions = await neuronDBSender.validateToken(result.token, aiToken);

      return {
        token: result.token,
        email: result.sub || email,
        permissions: this.formatPermissions(permissions.permissions || {})
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async changePassword(aiName, userToken, newPassword) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      return await neuronDBSender.changePassword(newPassword, userToken);
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async validateToken(aiName, token) {
    try {
      const config = new ConfigVO();
      const aiToken = config.getAIToken(aiName);

      if (!aiToken) {
        throw new Error(`AI ${aiName} not configured`);
      }

      const result = await neuronDBSender.validateToken(token, aiToken);

      if (!result) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }

      return {
        valid: true,
        email: result.sub,
        permissions: this.formatPermissions(result.permissions || {})
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
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

module.exports = new AuthenticationService();