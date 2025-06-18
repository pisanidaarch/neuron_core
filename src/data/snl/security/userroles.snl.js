// src/data/snl/security/userroles.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class UserrolesSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = ['main', 'core', 'userroles'];
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

  set(email, role) {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"${email}", ${JSON.stringify({ role })}`)
      .setPath(...this.entityPath)
      .build();
  }

  remove(email) {
    return this.builder
      .reset()
      .setCommand('remove')
      .setEntityType(this.entityType)
      .setValues(`"${email}"`)
      .setPath(...this.entityPath)
      .build();
  }
}

module.exports = new UserrolesSNL();