  // src/cross/entity/subscription.js

/**
 * Subscription entity for NeuronCore security module
 */
class Subscription {
    constructor(data = {}) {
        this.user_email = data.user_email || '';
        this.plan_id = data.plan_id || '';
        this.start_date = data.start_date || new Date().toISOString();
        this.end_date = data.end_date || null;
        this.user_count = data.user_count || 1;
        this.status = data.status || 'active'; // active, cancelled, expired
        this.payment_info = data.payment_info || {};
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    /**
     * Create subscription from NeuronDB response
     * @param {string} userEmail - User email (key)
     * @param {Object} data - Subscription data from NeuronDB
     * @returns {Subscription}
     */
    static fromNeuronDB(userEmail, data) {
        return new Subscription({
            user_email: userEmail,
            plan_id: data.plan_id || data.plan,
            start_date: data.start_date || data.date,
            end_date: data.end_date,
            user_count: data.user_count || 1,
            status: data.status || 'active',
            payment_info: data.payment_info || {},
            created_at: data.created_at,
            updated_at: data.updated_at
        });
    }

    /**
     * Convert to NeuronDB format
     * @returns {Object}
     */
    toNeuronDB() {
        return {
            email: this.user_email,
            plan: this.plan_id,
            date: this.start_date,
            end_date: this.end_date,
            user_count: this.user_count,
            status: this.status,
            payment_info: this.payment_info,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Validate subscription data
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.user_email || !this.user_email.includes('@')) {
            errors.push('Valid user email is required');
        }

        if (!this.plan_id) {
            errors.push('Plan ID is required');
        }

        if (this.user_count < 1) {
            errors.push('User count must be at least 1');
        }

        if (!['active', 'cancelled', 'expired'].includes(this.status)) {
            errors.push('Status must be active, cancelled, or expired');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if subscription is active
     * @returns {boolean}
     */
    isActive() {
        if (this.status !== 'active') return false;

        if (this.end_date) {
            const endDate = new Date(this.end_date);
            const now = new Date();
            return now < endDate;
        }

        return true;
    }

    /**
     * Cancel subscription
     * @param {Date} endDate - Optional end date, defaults to now
     */
    cancel(endDate = null) {
        this.status = 'cancelled';
        this.end_date = endDate ? endDate.toISOString() : new Date().toISOString();
        this.updated_at = new Date().toISOString();
    }

    /**
     * Renew subscription
     * @param {string} newPlanId - New plan ID
     * @param {Date} newEndDate - New end date
     */
    renew(newPlanId = null, newEndDate = null) {
        this.status = 'active';
        if (newPlanId) {
            this.plan_id = newPlanId;
        }
        if (newEndDate) {
            this.end_date = newEndDate.toISOString();
        }
        this.updated_at = new Date().toISOString();
    }

    /**
     * Change plan
     * @param {string} newPlanId - New plan ID
     */
    changePlan(newPlanId) {
        this.plan_id = newPlanId;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Update user count
     * @param {number} count - New user count
     */
    updateUserCount(count) {
        this.user_count = count;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Check if subscription allows more users
     * @param {number} maxUsers - Maximum users allowed by plan
     * @returns {boolean}
     */
    canAddUser(maxUsers) {
        return this.user_count < maxUsers;
    }

    /**
     * Add user to subscription
     * @param {number} maxUsers - Maximum users allowed by plan
     * @returns {boolean} Success
     */
    addUser(maxUsers) {
        if (this.canAddUser(maxUsers)) {
            this.user_count++;
            this.updated_at = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Remove user from subscription
     */
    removeUser() {
        if (this.user_count > 1) {
            this.user_count--;
            this.updated_at = new Date().toISOString();
        }
    }
}

module.exports = Subscription;