// src/core/security/groups.service.js
const neuronDBSender = require('../../data/sender/neurondb.sender');
const snl = require('../../data/snl');
const permissionManager = require('../../data/managers/permission.manager');
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

class GroupsService {
  async getAllGroups(aiName, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      const snlCommand = snl.usergroups.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, systemToken);

      return Object.entries(result || {}).map(([name, data]) => ({
        name,
        users: data.users || []
      }));
    } catch (error) {
      throw new Error(`Failed to get groups: ${error.message}`);
    }
  }

  async createGroup(aiName, groupName, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const systemToken = this.getSystemToken(aiName);
      const snlCommand = snl.usergroups.set(groupName, []);

      await neuronDBSender.executeSNL(snlCommand, systemToken);

      return { name: groupName, users: [] };
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  async addUserToGroup(aiName, groupName, userEmail, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const groups = await this.getAllGroups(aiName, adminToken);
      const group = groups.find(g => g.name === groupName);

      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.users.includes(userEmail)) {
        group.users.push(userEmail);

        const systemToken = this.getSystemToken(aiName);
        const snlCommand = snl.usergroups.set(groupName, group.users);
        await neuronDBSender.executeSNL(snlCommand, systemToken);
      }

      return group;
    } catch (error) {
      throw new Error(`Failed to add user to group: ${error.message}`);
    }
  }

  async removeUserFromGroup(aiName, groupName, userEmail, adminToken) {
    try {
      const isAdmin = await permissionManager.isAdmin(adminToken);
      if (!isAdmin) {
        throw new Error(ERRORS.INSUFFICIENT_PERMISSIONS);
      }

      const groups = await this.getAllGroups(aiName, adminToken);
      const group = groups.find(g => g.name === groupName);

      if (!group) {
        throw new Error('Group not found');
      }

      group.users = group.users.filter(email => email !== userEmail);

      const systemToken = this.getSystemToken(aiName);
      const snlCommand = snl.usergroups.set(groupName, group.users);
      await neuronDBSender.executeSNL(snlCommand, systemToken);

      return group;
    } catch (error) {
      throw new Error(`Failed to remove user from group: ${error.message}`);
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

module.exports = new GroupsService();