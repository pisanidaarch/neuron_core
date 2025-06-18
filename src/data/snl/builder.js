// src/data/snl/builder.js
const { ENTITY_TYPES } = require('../../cross/constants');

class SNLBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.command = null;
    this.entityType = null;
    this.values = null;
    this.path = null;
    return this;
  }

  setCommand(command) {
    this.command = command;
    return this;
  }

  setEntityType(type) {
    this.entityType = type;
    return this;
  }

  setValues(values) {
    this.values = values;
    return this;
  }

  setPath(database, namespace, entity) {
    const parts = [];
    if (database) parts.push(database);
    if (namespace) parts.push(namespace);
    if (entity) parts.push(entity);

    this.path = parts.join('.');
    return this;
  }

  build() {
    const parts = [];

    // Command and entity type
    parts.push(`${this.command}(${this.entityType})`);

    // Values (if present)
    if (this.values !== null && this.values !== undefined) {
      if (typeof this.values === 'string') {
        parts.push(`values(${this.values})`);
      } else if (Array.isArray(this.values)) {
        const quotedValues = this.values.map(v =>
          typeof v === 'string' ? `"${v}"` : JSON.stringify(v)
        );
        parts.push(`values(${quotedValues.join(', ')})`);
      } else if (typeof this.values === 'object') {
        parts.push(`values(${JSON.stringify(this.values)})`);
      }
    }

    // Path
    parts.push(`on(${this.path || ''})`);

    return parts.join('\n');
  }
}

module.exports = SNLBuilder;