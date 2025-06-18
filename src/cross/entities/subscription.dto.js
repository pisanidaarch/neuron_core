// src/cross/entities/subscription.dto.js
const { SUBSCRIPTION_STATUS } = require('../constants');

class SubscriptionDTO {
  constructor(data = {}) {
    this.userEmail = data.userEmail || '';
    this.plan = data.plan || '';
    this.status = data.status || SUBSCRIPTION_STATUS.ACTIVE;
    this.subscribedAt = data.subscribedAt || new Date().toISOString();
    this.userCount = data.userCount || 1;
    this.authorizedBy = data.authorizedBy || '';
    this.nick = data.nick || '';
    this.cancelledAt = data.cancelledAt || null;
    this.lastBillingDate = data.lastBillingDate || null;
    this.nextBillingDate = data.nextBillingDate || this.calculateNextBilling();
    this.metadata = data.metadata || {};
  }

  toStructure() {
    return {
      plan: this.plan,
      status: this.status,
      subscribedAt: this.subscribedAt,
      userCount: this.userCount,
      authorizedBy: this.authorizedBy,
      nick: this.nick,
      cancelledAt: this.cancelledAt,
      lastBillingDate: this.lastBillingDate,
      nextBillingDate: this.nextBillingDate,
      metadata: this.metadata
    };
  }

  toJSON() {
    return {
      userEmail: this.userEmail,
      plan: this.plan,
      status: this.status,
      subscribedAt: this.subscribedAt,
      userCount: this.userCount,
      authorizedBy: this.authorizedBy,
      nick: this.nick,
      cancelledAt: this.cancelledAt,
      lastBillingDate: this.lastBillingDate,
      nextBillingDate: this.nextBillingDate,
      metadata: this.metadata
    };
  }

  static fromStructure(email, data) {
    return new SubscriptionDTO({
      userEmail: email,
      plan: data.plan,
      status: data.status,
      subscribedAt: data.subscribedAt,
      userCount: data.userCount,
      authorizedBy: data.authorizedBy,
      nick: data.nick,
      cancelledAt: data.cancelledAt,
      lastBillingDate: data.lastBillingDate,
      nextBillingDate: data.nextBillingDate,
      metadata: data.metadata
    });
  }

  validate() {
    const errors = [];

    if (!this.userEmail || !this.userEmail.includes('@')) {
      errors.push('Valid user email is required');
    }

    if (!this.plan || this.plan.trim() === '') {
      errors.push('Plan is required');
    }

    if (!Object.values(SUBSCRIPTION_STATUS).includes(this.status)) {
      errors.push(`Status must be one of: ${Object.values(SUBSCRIPTION_STATUS).join(', ')}`);
    }

    if (typeof this.userCount !== 'number' || this.userCount < 1) {
      errors.push('User count must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  cancel() {
    this.status = SUBSCRIPTION_STATUS.CANCELLED;
    this.cancelledAt = new Date().toISOString();
  }

  activate() {
    this.status = SUBSCRIPTION_STATUS.ACTIVE;
    this.cancelledAt = null;
  }

  suspend() {
    this.status = SUBSCRIPTION_STATUS.SUSPENDED;
  }

  isActive() {
    return this.status === SUBSCRIPTION_STATUS.ACTIVE;
  }

  isCancelled() {
    return this.status === SUBSCRIPTION_STATUS.CANCELLED;
  }

  isSuspended() {
    return this.status === SUBSCRIPTION_STATUS.SUSPENDED;
  }

  calculateNextBilling() {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString();
  }

  addMetadata(key, value) {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata(key) {
    return this.metadata ? this.metadata[key] : null;
  }
}

module.exports = SubscriptionDTO;