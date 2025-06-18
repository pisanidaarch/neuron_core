// src/data/snl/security/planlimits.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class PlanlimitsSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = ['main', 'core', 'planlimits'];
  }

  create() {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues({})
      .setPath(...this.entityPath)
      .build();
  }

  getAll() {
    return this.builder
      .reset()
      .setCommand('view')
      .setEntityType(this.entityType)
      .setPath(...this.entityPath)
      .build();
  }

  set(planId, limits) {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"${planId}", ${JSON.stringify(limits)}`)
      .setPath(...this.entityPath)
      .build();
  }

  remove(planId) {
    return this.builder
      .reset()
      .setCommand('remove')
      .setEntityType(this.entityType)
      .setValues(`"${planId}"`)
      .setPath(...this.entityPath)
      .build();
  }
}

module.exports = new PlanlimitsSNL();