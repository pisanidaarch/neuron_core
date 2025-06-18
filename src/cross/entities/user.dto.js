// src/cross/entities/user.dto.js
const { ROLES } = require('../constants');

class UserDTO {
  constructor(data = {}) {
    this.email = data.email || '';
    this.password = data.password || '';
    this.nick = data.nick || this.email.split('@')[0];
    this.role = data.role || ROLES.DEFAULT;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.active = data.active !== undefined ? data.active : true;
  }

  toNeuronDBFormat() {
    return {
      email: this.email,
      password: this.password,
      nick: this.nick,
      roles: {
        permissions: {
          main: 1 // Default read-only permission
        }
      }
    };
  }

  toJSON() {
    return {
      email: this.email,
      nick: this.nick,
      role: this.role,
      createdAt: this.createdAt,
      active: this.active
    };
  }

  static fromNeuronDB(data) {
    return new UserDTO({
      email: data.email || data.sub,
      nick: data.nick,
      role: data.role || ROLES.DEFAULT,
      createdAt: data.createdAt,
      active: data.active
    });
  }

  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!Object.values(ROLES).includes(this.role)) {
      errors.push(`Role must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = UserDTO;