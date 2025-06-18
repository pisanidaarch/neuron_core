// src/data/sender/neurondb.sender.js
const axios = require('axios');
const ConfigVO = require('../../cross/entities/config.vo');

class NeuronDBSender {
  constructor() {
    this.baseURL = ConfigVO.NEURONDB_URL;
  }

  async executeSNL(snlCommand, token) {
    try {
      const response = await axios.post(`${this.baseURL}/snl`, snlCommand, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`SNL execution failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async login(loginData, token) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, loginData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async validateToken(userToken, systemToken) {
    try {
      const response = await axios.get(`${this.baseURL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token validation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async changePassword(newPassword, userToken) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/change-password`, {
        newPwd: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Password change failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createUser(userData, systemToken) {
    try {
      const response = await axios.post(`${this.baseURL}/set_user`, userData, {
        headers: {
          'Authorization': `Bearer ${systemToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`User creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async setPermission(email, database, level, systemToken) {
    try {
      const response = await axios.post(`${this.baseURL}/permission/set`, {
        email,
        database,
        level
      }, {
        headers: {
          'Authorization': `Bearer ${systemToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Permission setting failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async listDatabases(token) {
    try {
      const response = await axios.get(`${this.baseURL}/databases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Database listing failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createDatabase(databaseName, token) {
    try {
      const response = await axios.post(`${this.baseURL}/database`, {
        name: databaseName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Database creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createNamespace(databaseName, namespaceName, token) {
    try {
      const response = await axios.post(`${this.baseURL}/namespace`, {
        database: databaseName,
        namespace: namespaceName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Namespace creation failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new NeuronDBSender();