// src/cross/entities/plan.dto.js
class PlanDTO {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.price = data.price || 0;
    this.limits = data.limits || {};
    this.features = data.features || [];
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toStructure() {
    return {
      name: this.name,
      price: this.price,
      limits: this.limits,
      features: this.features,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      limits: this.limits,
      features: this.features,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromStructure(id, data) {
    return new PlanDTO({
      id,
      name: data.name,
      price: data.price,
      limits: data.limits,
      features: data.features,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  validate() {
    const errors = [];

    if (!this.id || this.id.trim() === '') {
      errors.push('Plan ID is required');
    }

    if (!this.name || this.name.trim() === '') {
      errors.push('Plan name is required');
    }

    if (typeof this.price !== 'number' || this.price < 0) {
      errors.push('Price must be a non-negative number');
    }

    if (this.limits && typeof this.limits !== 'object') {
      errors.push('Limits must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  hasLimit(limitType) {
    return this.limits && this.limits[limitType] !== undefined;
  }

  getLimit(limitType) {
    return this.limits ? this.limits[limitType] : null;
  }

  setLimit(limitType, value) {
    if (!this.limits) {
      this.limits = {};
    }
    this.limits[limitType] = value;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = PlanDTO;