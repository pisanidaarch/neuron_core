// src/data/snl/security/aiconfig.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES, NEURONDB_PATHS } = require('../../../cross/constants');

class AIConfigSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = NEURONDB_PATHS.CONFIG_AI.split('.');
  }

  getAll() {
    return this.builder
      .reset()
      .setCommand('view')
      .setEntityType(this.entityType)
      .setPath(...this.entityPath)
      .build();
  }

  checkEntityExists(database, namespace, entity, type) {
    return this.builder
      .reset()
      .setCommand('view')
      .setEntityType(type)
      .setPath(database, namespace, entity)
      .build();
  }
}

module.exports = new AIConfigSNL();