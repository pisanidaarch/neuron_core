// src/cross/security/ai-keys.vo.js
class AIKeysVO {
  constructor(data = {}) {
    this.keys = new Map();

    if (data) {
      Object.entries(data).forEach(([aiName, tokenData]) => {
        this.keys.set(aiName, tokenData[aiName]);
      });
    }
  }

  getToken(aiName) {
    return this.keys.get(aiName);
  }

  hasAI(aiName) {
    return this.keys.has(aiName);
  }

  getAllAIs() {
    return Array.from(this.keys.keys());
  }

  toJSON() {
    const obj = {};
    this.keys.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

module.exports = AIKeysVO;