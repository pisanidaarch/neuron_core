// src/cross/security/config.vo.js
const NodeCache = require('node-cache');

class ConfigVO {
  constructor() {
    // Singleton pattern
    if (ConfigVO.instance) {
      return ConfigVO.instance;
    }

    // Static configuration
    this.NEURONDB_URL = 'https://ndb.archoffice.tech';
    this.CONFIG_JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyZWFkZXIiLCJleHAiOjQ5MDExMTM2NzksInBlcm1pc3Npb25zIjp7ImNvbmZpZyI6MSwibWFpbiI6MSwiZ2xvYmFsIjoxfSwibGV2ZWwiOjEsImluc3RhbmNlIjoiYWFpLWNvbmZpZyJ9.oWmnh2bfS0iLQOaHUOcqJxgctPWg6_jDu0RsV48v4Ys';
    this.ADMIN_EMAIL = 'su';

    // Cache with 5 minutes TTL
    this.cache = new NodeCache({ stdTTL: 300 });

    ConfigVO.instance = this;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  flushAll() {
    return this.cache.flushAll();
  }
}

module.exports = new ConfigVO();