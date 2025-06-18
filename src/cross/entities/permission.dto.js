// src/cross/entities/permission.dto.js
const { PERMISSIONS, PERMISSION_NAMES } = require('../constants');

class PermissionDTO {
  constructor(data = {}) {
    this.database = data.database || '';
    this.level = data.level || PERMISSIONS.READ_ONLY;
    this.levelName = data.levelName || this.getLevelName(this.level);
    this.grantedAt = data.grantedAt || new Date().toISOString();
    this.grantedBy = data.grantedBy || '';
  }

  toJSON() {
    return {
      database: this.database,
      level: this.level,
      levelName: this.levelName,
      grantedAt: this.grantedAt,
      grantedBy: this.grantedBy
    };
  }

  static fromNeuronDB(permissionsData) {
    if (!permissionsData || typeof permissionsData !== 'object') {
      return [];
    }

    return Object.entries(permissionsData).map(([database, level]) =>
      new PermissionDTO({
        database,
        level: parseInt(level, 10),
        levelName: PERMISSION_NAMES[level] || 'unknown'
      })
    );
  }

  getLevelName(level) {
    return PERMISSION_NAMES[level] || 'unknown';
  }

  canRead() {
    return this.level >= PERMISSIONS.READ_ONLY;
  }

  canWrite() {
    return this.level >= PERMISSIONS.READ_WRITE;
  }

  isAdmin() {
    return this.level >= PERMISSIONS.ADMIN;
  }

  validate() {
    const errors = [];

    if (!this.database || this.database.trim() === '') {
      errors.push('Database name is required');
    }

    if (!Object.values(PERMISSIONS).includes(this.level)) {
      errors.push(`Level must be one of: ${Object.values(PERMISSIONS).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createReadOnly(database) {
    return new PermissionDTO({
      database,
      level: PERMISSIONS.READ_ONLY
    });
  }

  static createReadWrite(database) {
    return new PermissionDTO({
      database,
      level: PERMISSIONS.READ_WRITE
    });
  }

  static createAdmin(database) {
    return new PermissionDTO({
      database,
      level: PERMISSIONS.ADMIN
    });
  }
}

module.exports = PermissionDTO;