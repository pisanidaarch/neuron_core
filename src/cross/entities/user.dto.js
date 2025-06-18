// src/cross/security/user.dto.js
class UserDTO {
  constructor(data = {}) {
    this.email = data.email;
    this.nick = data.nick;
    this.password = data.password;
    this.roles = data.roles || { permissions: { main: 1 } };
    this.token = data.token;
    this.plan = data.plan;
    this.group = data.group;
    this.role = data.role || 'default';
  }

  toNeuronDBFormat() {
    return {
      email: this.email,
      password: this.password,
      nick: this.nick,
      roles: this.roles
    };
  }

  static fromNeuronDB(data) {
    return new UserDTO({
      email: data.sub,
      roles: data.permissions,
      token: data.token
    });
  }
}

module.exports = UserDTO;