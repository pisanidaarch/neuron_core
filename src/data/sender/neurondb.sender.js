// src/data/sender/neurondb.sender.js
const axios = require('axios');
const ConfigVO = require('../../cross/entities/config.vo');

class NeuronDBSender {
  constructor() {
    this.baseURL = ConfigVO.NEURONDB_URL;
  }

  async sendRequest(endpoint, data, token, isJSON = true) {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': isJSON ? 'application/json' : 'text/plain'
        }
      };

      const response = await axios.post(
        `${this.baseURL}${endpoint}`,
        data,
        config
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async executeSNL(snlCommand, token) {
    return this.sendRequest('/snl', snlCommand, token, false);
  }

  async login(email, password) {
    return this.sendRequest('/auth/login', { email, password }, null);
  }

  async changePassword(newPassword, token) {
    return this.sendRequest('/auth/change-password', { newPwd: newPassword }, token);
  }

  async validateToken(token) {
    return this.sendRequest('/auth/validate', {}, token);
  }

  async createUser(userData, systemToken) {
    return this.sendRequest('/set_user', userData, systemToken);
  }

  async setPermission(email, database, level, systemToken) {
    return this.sendRequest('/permission/set',
      { email, database, level },
      systemToken
    );
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.error || error.response.data?.message || 'Unknown error';
      const status = error.response.status;

      const customError = new Error(message);
      customError.status = status;
      customError.originalError = error;

      throw customError;
    }
    throw error;
  }
}

module.exports = new NeuronDBSender();