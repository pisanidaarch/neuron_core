// src/data/snl/security/usergroups.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class UserGroupsSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = ['main', 'core', 'usergroups'];
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

  set(groupName, users = []) {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"${groupName}", ${JSON.stringify({ users })}`)
      .setPath(...this.entityPath)
      .build();
  }

  remove(groupName) {
    return this.builder
      .reset()
      .setCommand('remove')
      .setEntityType(this.entityType)
      .setValues(`"${groupName}"`)
      .setPath(...this.entityPath)
      .build();
  }
}

module.exports = new UserGroupsSNL();