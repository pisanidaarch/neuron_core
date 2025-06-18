// src/cross/security/permission.dto.js
class PermissionDTO {
  constructor(data = {}) {
    this.database = data.database;
    this.level = data.level;
    this.levelName = this.getLevelName(data.level);
  }

  getLevelName(level) {
    switch(level) {
      case 1: return 'read-only';
      case 2: return 'read-write';
      case 3: return 'admin';
      default: return 'unknown';
    }
  }

  static fromNeuronDB(permissions) {
    return Object.entries(permissions).map(([db, level]) =>
      new PermissionDTO({ database: db, level })
    );
  }

  toJSON() {
    return {
      database: this.database,
      level: this.level,
      levelName: this.levelName
    };
  }
}

module.exports = PermissionDTO;