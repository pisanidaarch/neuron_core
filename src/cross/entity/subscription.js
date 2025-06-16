// src/cross/entity/subscription.js

/**
 * Subscription Entity - Represents a user subscription
 */
class Subscription {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userEmail = data.userEmail || '';
        this.planId = data.planId || '';
        this.status = data.status || 'active'; // active, cancelled, expired, payment_failed, suspended
        this.billingCycle = data.billingCycle || 'monthly'; // monthly, yearly
        this.amount = data.amount || 0;
        this.currency = data.currency || 'BRL';
        this.paymentMethod = data.paymentMethod || '';
        this.currentPeriodStart = data.currentPeriodStart || new Date().toISOString();
        this.currentPeriodEnd = data.currentPeriodEnd || this.calculatePeriodEnd();
        this.nextBillingDate = data.nextBillingDate || this.currentPeriodEnd;
        this.trialEnd = data.trialEnd || null;
        this.cancelAtPeriodEnd = data.cancelAtPeriodEnd || false;
        this.cancelledAt = data.cancelledAt || null;
        this.cancellationReason = data.cancellationReason || null;
        this.autoRenew = data.autoRenew !== undefined ? data.autoRenew : true;
        this.metadata = data.metadata || {};
        this.payments = data.payments || [];
        this.aiName = data.aiName || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate unique ID for subscription
     * @returns {string}
     */
    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `sub_${timestamp}_${random}`;
    }

    /**
     * Calculate period end based on billing cycle
     * @returns {string}
     */
    calculatePeriodEnd() {
        const startDate = new Date(this.currentPeriodStart || new Date());

        if (this.billingCycle === 'yearly') {
            startDate.setFullYear(startDate.getFullYear() + 1);
        } else {
            startDate.setMonth(startDate.getMonth() + 1);
        }

        return startDate.toISOString();
    }

    /**
     * Validate the subscription entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.userEmail || this.userEmail.trim().length === 0) {
            errors.push('User email is required');
        }

        if (!this.planId || this.planId.trim().length === 0) {
            errors.push('Plan ID is required');
        }

        const validStatuses = ['active', 'cancelled', 'expired', 'payment_failed', 'suspended', 'trial'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const validBillingCycles = ['monthly', 'yearly'];
        if (this.billingCycle && !validBillingCycles.includes(this.billingCycle)) {
            errors.push(`Invalid billing cycle. Must be one of: ${validBillingCycles.join(', ')}`);
        }

        if (this.amount && (typeof this.amount !== 'number' || this.amount < 0)) {
            errors.push('Amount must be a non-negative number');
        }

        if (!this.aiName || this.aiName.trim().length === 0) {
            errors.push('AI name is required');
        }

        // Validate email format
        if (this.userEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.userEmail)) {
                errors.push('Invalid email format');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            userEmail: this.userEmail,
            planId: this.planId,
            status: this.status,
            billingCycle: this.billingCycle,
            amount: this.amount,
            currency: this.currency,
            paymentMethod: this.paymentMethod,
            currentPeriodStart: this.currentPeriodStart,
            currentPeriodEnd: this.currentPeriodEnd,
            nextBillingDate: this.nextBillingDate,
            trialEnd: this.trialEnd,
            cancelAtPeriodEnd: this.cancelAtPeriodEnd,
            cancelledAt: this.cancelledAt,
            cancellationReason: this.cancellationReason,
            autoRenew: this.autoRenew,
            metadata: this.metadata,
            payments: this.payments,
            aiName: this.aiName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {Subscription}
     */
    static fromObject(data) {
        return new Subscription(data);
    }

    /**
     * Update subscription status
     * @param {string} status - New status
     * @param {string} reason - Reason for status change
     */
    updateStatus(status, reason = '') {
        this.status = status;
        this.updatedAt = new Date().toISOString();

        if (reason) {
            this.metadata.statusChangeReason = reason;
            this.metadata.statusChangeDate = this.updatedAt;
        }

        if (status === 'cancelled') {
            this.cancelledAt = this.updatedAt;
            this.cancellationReason = reason;
        }
    }

    /**
     * Cancel subscription
     * @param {string} reason - Cancellation reason
     * @param {Date} effectiveDate - When cancellation takes effect
     */
    cancel(reason = '', effectiveDate = null) {
        this.status = 'cancelled';
        this.cancelledAt = new Date().toISOString();
        this.cancellationReason = reason;
        this.autoRenew = false;

        if (effectiveDate) {
            this.cancelAtPeriodEnd = true;
            this.metadata.cancellationEffectiveDate = effectiveDate.toISOString();
        }

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Renew subscription for next period
     */
    renew() {
        const currentEnd = new Date(this.currentPeriodEnd);

        this.currentPeriodStart = this.currentPeriodEnd;

        if (this.billingCycle === 'yearly') {
            currentEnd.setFullYear(currentEnd.getFullYear() + 1);
        } else {
            currentEnd.setMonth(currentEnd.getMonth() + 1);
        }

        this.currentPeriodEnd = currentEnd.toISOString();
        this.nextBillingDate = this.currentPeriodEnd;
        this.status = 'active';
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Change subscription plan
     * @param {string} newPlanId - New plan ID
     * @param {string} billingCycle - Billing cycle
     */
    changePlan(newPlanId, billingCycle = null) {
        this.planId = newPlanId;

        if (billingCycle) {
            this.billingCycle = billingCycle;
            // Recalculate period end based on new billing cycle
            this.currentPeriodEnd = this.calculatePeriodEnd();
            this.nextBillingDate = this.currentPeriodEnd;
        }

        this.updatedAt = new Date().toISOString();

        // Store plan change history
        if (!this.metadata.planChanges) {
            this.metadata.planChanges = [];
        }

        this.metadata.planChanges.push({
            date: this.updatedAt,
            newPlanId: newPlanId,
            billingCycle: this.billingCycle
        });
    }

    /**
     * Add payment record
     * @param {Object} paymentData - Payment information
     */
    addPayment(paymentData) {
        const payment = {
            id: paymentData.id || `pay_${Date.now()}`,
            amount: paymentData.amount || this.amount,
            currency: paymentData.currency || this.currency,
            status: paymentData.status || 'succeeded',
            method: paymentData.method || this.paymentMethod,
            date: paymentData.date || new Date().toISOString(),
            transactionId: paymentData.transactionId || null,
            metadata: paymentData.metadata || {}
        };

        this.payments.push(payment);
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Check if subscription is active
     * @returns {boolean}
     */
    isActive() {
        return this.status === 'active' && new Date() < new Date(this.currentPeriodEnd);
    }

    /**
     * Check if subscription is in trial
     * @returns {boolean}
     */
    isInTrial() {
        if (!this.trialEnd) return false;
        return new Date() < new Date(this.trialEnd);
    }

    /**
     * Check if subscription is expired
     * @returns {boolean}
     */
    isExpired() {
        return new Date() > new Date(this.currentPeriodEnd);
    }

    /**
     * Get days until expiration
     * @returns {number}
     */
    getDaysUntilExpiration() {
        const now = new Date();
        const endDate = new Date(this.currentPeriodEnd);
        const diffTime = endDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get total amount paid
     * @returns {number}
     */
    getTotalAmountPaid() {
        return this.payments
            .filter(payment => payment.status === 'succeeded')
            .reduce((total, payment) => total + payment.amount, 0);
    }

    /**
     * Get last payment
     * @returns {Object|null}
     */
    getLastPayment() {
        if (this.payments.length === 0) return null;

        return this.payments
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    /**
     * Set trial period
     * @param {number} days - Trial days
     */
    setTrialPeriod(days) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + days);
        this.trialEnd = trialEnd.toISOString();
        this.status = 'trial';
        this.updatedAt = new Date().toISOString();
    }

    /**
     * End trial and activate subscription
     */
    endTrial() {
        this.trialEnd = new Date().toISOString();
        this.status = 'active';
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Suspend subscription
     * @param {string} reason - Suspension reason
     */
    suspend(reason = '') {
        this.status = 'suspended';
        this.metadata.suspensionReason = reason;
        this.metadata.suspensionDate = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Reactivate suspended subscription
     */
    reactivate() {
        this.status = 'active';
        if (this.metadata.suspensionReason) {
            delete this.metadata.suspensionReason;
        }
        if (this.metadata.suspensionDate) {
            delete this.metadata.suspensionDate;
        }
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Create a new subscription
     * @param {string} userEmail - User email
     * @param {string} planId - Plan ID
     * @param {string} aiName - AI name
     * @param {Object} options - Additional options
     * @returns {Subscription}
     */
    static createNew(userEmail, planId, aiName, options = {}) {
        return new Subscription({
            userEmail,
            planId,
            aiName,
            billingCycle: options.billingCycle || 'monthly',
            amount: options.amount || 0,
            currency: options.currency || 'BRL',
            paymentMethod: options.paymentMethod || '',
            trialEnd: options.trialDays ? (() => {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + options.trialDays);
                return trialEnd.toISOString();
            })() : null,
            status: options.trialDays ? 'trial' : 'active'
        });
    }
}

module.exports = Subscription;