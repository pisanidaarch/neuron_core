// src/data/snl/config/behavior.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class BehaviorSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
  }

  /**
   * Get behavior for specific AI
   * SNL: view(structure) on(config.{aiName}.behavior)
   */
  getByAI(aiName) {
    return this.builder
      .reset()
      .setCommand('view')
      .setEntityType(this.entityType)
      .setPath('config', aiName, 'behavior')
      .build();
  }

  /**
   * Set behavior for specific AI
   * SNL: set(structure) values(...) on(config.{aiName}.behavior)
   */
  setByAI(aiName, behaviorText) {
    const behaviorData = {
      default: {
        behavior: behaviorText
      }
    };

    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"default", ${JSON.stringify(behaviorData.default)}`)
      .setPath('config', aiName, 'behavior')
      .build();
  }
}

module.exports = new BehaviorSNL();