// src/data/snl/config/agent.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class AgentSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = ['config', 'general', 'agent'];
  }

  /**
   * Get all agent configurations
   * SNL: view(structure) on(config.general.agent)
   */
  getAll() {
    return this.builder
      .reset()
      .setCommand('view')
      .setEntityType(this.entityType)
      .setPath(...this.entityPath)
      .build();
  }

  /**
   * Set configuration for specific agent
   * SNL: set(structure) values(...) on(config.general.agent)
   */
  setAgent(agentName, agentConfig) {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"${agentName}", ${JSON.stringify(agentConfig)}`)
      .setPath(...this.entityPath)
      .build();
  }

  /**
   * Remove agent configuration
   * SNL: remove(structure) values(...) on(config.general.agent)
   */
  removeAgent(agentName) {
    return this.builder
      .reset()
      .setCommand('remove')
      .setEntityType(this.entityType)
      .setValues(`"${agentName}"`)
      .setPath(...this.entityPath)
      .build();
  }
}

module.exports = new AgentSNL();