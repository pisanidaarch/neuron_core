// src/cross/entities/config.vo.js
const fs = require('fs');
const path = require('path');

class ConfigVO {
  constructor() {
    if (ConfigVO.instance) {
      return ConfigVO.instance;
    }

    this.config = null;
    this.aiKeys = new Map(); // IAs e suas keys do sistema
    this.behaviors = new Map(); // Behaviors de cada IA
    this.agents = new Map(); // Configurações dos agentes (gpt, claude, etc.)

    this.loadFixedConfig();
    ConfigVO.instance = this;

    return this;
  }

  loadFixedConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      throw new Error(`Failed to load config.json: ${error.message}`);
    }
  }

  // ========== STATIC GETTERS - VALORES FIXOS ==========

  static get NEURONDB_URL() {
    const instance = new ConfigVO();
    return instance.config.neurondb.url;
  }

  static get CONFIG_JWT() {
    const instance = new ConfigVO();
    return instance.config.neurondb.config_jwt;
  }

  static get SERVER_PORT() {
    const instance = new ConfigVO();
    return instance.config.server.port;
  }

  // ========== AI MANAGEMENT (via SNL) ==========

  setAIKeys(aiKeysData) {
    this.aiKeys.clear();
    if (aiKeysData) {
      Object.entries(aiKeysData).forEach(([aiName, tokenData]) => {
        // Estrutura: { "ami": { "key": "jwt..." } }
        this.aiKeys.set(aiName, tokenData.key);
      });
    }
  }

  getAIToken(aiName) {
    return this.aiKeys.get(aiName);
  }

  hasAI(aiName) {
    return this.aiKeys.has(aiName);
  }

  getAllAIs() {
    return Array.from(this.aiKeys.keys());
  }

  // ========== BEHAVIOR MANAGEMENT (via SNL) ==========

  setBehavior(aiName, behaviorData) {
    if (behaviorData && behaviorData.default && behaviorData.default.behavior) {
      this.behaviors.set(aiName, behaviorData.default.behavior);
    }
  }

  getBehavior(aiName) {
    return this.behaviors.get(aiName);
  }

  getAllBehaviors() {
    return Array.from(this.behaviors.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  }

  // ========== AGENT MANAGEMENT (via SNL) ==========

  setAgents(agentsData) {
    this.agents.clear();
    if (agentsData) {
      Object.entries(agentsData).forEach(([agentName, config]) => {
        this.agents.set(agentName, config);
      });
    }
  }

  getAgent(agentName) {
    return this.agents.get(agentName);
  }

  getAllAgents() {
    return Array.from(this.agents.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  }

  // ========== VALIDATION ==========

  validateAI(aiName) {
    if (!aiName) {
      throw new Error('AI name is required');
    }

    if (!this.hasAI(aiName)) {
      throw new Error(`Invalid AI name: ${aiName}. Available: ${this.getAllAIs().join(', ')}`);
    }

    return true;
  }

  // ========== CACHE MANAGEMENT ==========

  clear() {
    // NÃO limpa configurações fixas, apenas dados dinâmicos
    this.aiKeys.clear();
    this.behaviors.clear();
    this.agents.clear();
  }

  flushAll() {
    this.clear();
  }

  // ========== CONFIGURATION INFO ==========

  getConfigInfo() {
    return {
      fixed: {
        neurondb_url: this.config.neurondb.url,
        server_port: this.config.server.port,
        has_config_jwt: !!this.config.neurondb.config_jwt
      },
      dynamic: {
        ais_count: this.aiKeys.size,
        behaviors_count: this.behaviors.size,
        agents_count: this.agents.size,
        available_ais: this.getAllAIs()
      },
      last_updated: new Date().toISOString()
    };
  }
}

// Ensure singleton
ConfigVO.instance = null;

module.exports = ConfigVO;