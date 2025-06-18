// src/data/managers/user.manager.js
const neuronDBSender = require('../sender/neurondb.sender');
const snl = require('../snl');
const UserDTO = require('../../cross/entities/user.dto');
const ConfigVO = require('../../cross/entities/config.vo');
const AIKeysVO = require('../../cross/entities/ai-keys.vo');

class UserManager {
  async createUser(aiName, userData) {
    try {
      // Get AI token
      const aiKeys = ConfigVO.get('AI_KEYS');
      if (!aiKeys || !aiKeys.hasAI(aiName)) {
        throw new Error('AI configuration not found');
      }

      const systemToken = aiKeys.getToken(aiName);
      const userDTO = new UserDTO(userData);

      // Create user in NeuronDB
      const result = await neuronDBSender.createUser(
        userDTO.toNeuronDBFormat(),
        systemToken
      );

      // Set default role
      await this.setUserRole(userDTO.email, userDTO.role || 'default', systemToken);

      return result;
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
      return result[email] || null;
    } catch (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async setPermission(aiName, email, database, level) {
    try {
      const aiKeys = ConfigVO.get('AI_KEYS');
      if (!aiKeys || !aiKeys.hasAI(aiName)) {
        throw new Error('AI configuration not found');
      }

      const systemToken = aiKeys.getToken(aiName);
      return await neuronDBSender.setPermission(email, database, level, systemToken);
    } catch (error) {
      throw new Error(`Failed to set permission: ${error.message}`);
    }
  }
}

module.exports = new UserManager();