// src/cross/security/subscription.dto.js
class SubscriptionDTO {
  constructor(data = {}) {
    this.userEmail = data.userEmail;
    this.plan = data.plan;
    this.subscribedAt = data.subscribedAt || new Date().toISOString();
    this.userCount = data.userCount || 1;
    this.status = data.status || 'active';
    this.billing = data.billing || [];
  }

  toStructure() {
    return {
      email: this.userEmail,
      plan: this.plan,
      subscribedAt: this.subscribedAt,
      userCount: this.userCount,
      status: this.status
    };
  }

  static fromStructure(email, data) {
    return new SubscriptionDTO({
      userEmail: email,
      ...data
    });
  }

  getTotalPrice(planPrice) {
    return planPrice * this.userCount;
  }
}

module.exports = SubscriptionDTO;