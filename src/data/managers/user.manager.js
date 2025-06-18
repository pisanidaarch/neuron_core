// src/data/managers/user.manager.js
const neuronDBSender = require('../sender/neurondb.sender');
const snl = require('../snl');
const UserDTO = require('../../cross/entities/user.dto');
const ConfigVO = require('../../cross/entities/config.vo');

class UserManager {
  async createUser(aiName, userData) {
    try {
      // Get AI token using new ConfigVO structure
      const config = new ConfigVO();
      const systemToken = config.getAIToken(aiName);

      if (!systemToken) {
        throw new Error(`AI configuration not found for ${aiName}`);
      }

      const userDTO = new UserDTO(userData);

      // Validate user data
      const validation = userDTO.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Create user in NeuronDB
      const result = await neuronDBSender.createUser(
        userDTO.toNeuronDBFormat(),
        systemToken
      );

      // Set default role
      await this.setUserRole(userDTO.email, userDTO.role || 'default', systemToken);

      return {
        email: userDTO.email,
        nick: userDTO.nick,
        role: userDTO.role,
        created: true
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async setUserRole(email, role, systemToken) {
    try {
      const snlCommand = snl.userroles.set(email, role);
      return await neuronDBSender.executeSNL(snlCommand, systemToken);
    } catch (error) {
      throw new Error(`Failed to set user role: ${error.message}`);
    }
  }

  async getUserRole(email, systemToken) {
    try {
      const snlCommand = snl.userroles.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);

      if (!result || !result[email]) {
        return null;
      }

      return result[email].role || null;
    } catch (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async setPermission(aiName, email, database, level) {
    try {
      const config = new ConfigVO();
      const systemToken = config.getAIToken(aiName);

      if (!systemToken) {
        throw new Error(`AI configuration not found for ${aiName}`);
      }

      return await neuronDBSender.setPermission(email, database, level, systemToken);
    } catch (error) {
      throw new Error(`Failed to set permission: ${error.message}`);
    }
  }

  async getAllUsers(aiName) {
    try {
      const config = new ConfigVO();
      const systemToken = config.getAIToken(aiName);

      if (!systemToken) {
        throw new Error(`AI configuration not found for ${aiName}`);
      }

      // Get all user roles as a proxy for users
      const snlCommand = snl.userroles.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);

      if (!result) return [];

      return Object.entries(result).map(([email, data]) => ({
        email,
        role: data.role || 'default'
      }));
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  async deleteUser(aiName, email) {
    try {
      const config = new ConfigVO();
      const systemToken = config.getAIToken(aiName);

      if (!systemToken) {
        throw new Error(`AI configuration not found for ${aiName}`);
      }

      // Remove user role
      const snlCommand = snl.userroles.remove(email);
      return await neuronDBSender.executeSNL(snlCommand, systemToken);
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = new UserManager();