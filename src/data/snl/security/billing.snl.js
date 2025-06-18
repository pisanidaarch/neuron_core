// src/data/snl/security/billing.snl.js
const SNLBuilder = require('../builder');
const { ENTITY_TYPES } = require('../../../cross/constants');

class BillingSNL {
  constructor() {
    this.builder = new SNLBuilder();
    this.entityType = ENTITY_TYPES.STRUCTURE;
    this.entityPath = ['main', 'core', 'billing'];
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

  set(email, billingData) {
    return this.builder
      .reset()
      .setCommand('set')
      .setEntityType(this.entityType)
      .setValues(`"${email}", ${JSON.stringify(billingData)}`)
      .setPath(...this.entityPath)
      .build();
  }

  get(email) {
    // Since we can't get a specific item, we get all and filter
    return this.getAll();
  }

  addPayment(email, payment) {
    // This would need to get current billing, add payment, and set again
    // For now, just returning the set command
    return this.set(email, { payments: [payment] });
  }
}

module.exports = new BillingSNL();