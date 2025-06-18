// src/cross/security/plan.dto.js
class PlanDTO {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.price = data.price || 0;
    this.features = data.features || [];
    this.limits = data.limits || {};
    this.active = data.active !== false;
  }

  toStructure() {
    return {
      name: this.name,
      price: this.price,
      features: this.features,
      limits: this.limits,
      active: this.active
    };
  }

  static fromStructure(id, data) {
    return new PlanDTO({
      id,
      ...data
    });
  }
}

module.exports = PlanDTO;