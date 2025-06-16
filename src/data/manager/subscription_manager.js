// src/data/manager/subscription_manager.js

const Subscription = require('../../cross/entity/subscription');
const SubscriptionSNL = require('../snl/subscription_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * SubscriptionManager - Manages Subscription entity operations
 */
class SubscriptionManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new SubscriptionSNL();
        this.sender = new AISender();
    }

    /**
     * Initialize subscription structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.snl.checkSubscriptionsStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiToken);

            const exists = this.snl.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.snl.createSubscriptionsStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiToken);
                console.log('✅ Subscriptions structure created');
            }
        } catch (error) {
            console.error('Failed to initialize subscriptions structure:', error);
            throw error;
        }
    }

    /**
     * Create or update subscription
     * @param {Subscription} subscription - Subscription entity
     * @returns {Promise<Subscription>}
     */
    async saveSubscription(subscription) {
        try {
            const validation = subscription.validate();
            if (!validation.valid) {
                throw new ValidationError(`Subscription validation failed: ${validation.errors.join(', ')}`);
            }

            subscription.updatedAt = new Date().toISOString();
            const subscriptionData = this.snl.buildSubscriptionData(subscription);
            const command = this.snl.setSubscriptionSNL(subscription.id, subscriptionData);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Subscription saved: ${subscription.id}`);
            return subscription;
        } catch (error) {
            console.error('Failed to save subscription:', error);
            throw error;
        }
    }

    /**
     * Get subscription by ID
     * @param {string} subscriptionId - Subscription ID
     * @returns {Promise<Subscription|null>}
     */
    async getSubscription(subscriptionId) {
        try {
            const command = this.snl.getSubscriptionSNL(subscriptionId);
            const response = await this.sender.executeSNL(command, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const subscriptionData = this.snl.parseSubscriptionData(response);
            return Subscription.fromObject(subscriptionData);
        } catch (error) {
            console.error('Failed to get subscription:', error);
            throw error;
        }
    }

    /**
     * Get subscription by user email
     * @param {string} userEmail - User email
     * @returns {Promise<Subscription|null>}
     */
    async getSubscriptionByUser(userEmail) {
        try {
            const command = this.snl.getSubscriptionByUserSNL(userEmail);
            const response = await this.sender.executeSNL(command, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const subscriptionData = this.snl.parseSubscriptionData(response);
            return Subscription.fromObject(subscriptionData);
        } catch (error) {
            console.error('Failed to get subscription by user:', error);
            throw error;
        }
    }

    /**
     * List all subscriptions
     * @param {Object} options - Filter options
     * @returns {Promise<Subscription[]>}
     */
    async listSubscriptions(options = {}) {
        try {
            const { status, planId, page = 1, limit = 20 } = options;

            const command = this.snl.listSubscriptionsSNL();
            const response = await this.sender.executeSNL(command, this.aiToken);

            const subscriptionIds = this.snl.parseSubscriptionsList(response);
            const subscriptions = [];

            for (const subscriptionId of subscriptionIds) {
                const subscription = await this.getSubscription(subscriptionId);
                if (subscription) {
                    // Apply filters
                    if (status && subscription.status !== status) continue;
                    if (planId && subscription.planId !== planId) continue;

                    subscriptions.push(subscription);
                }
            }

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            return subscriptions.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Failed to list subscriptions:', error);
            throw error;
        }
    }

    /**
     * Update subscription status
     * @param {string} subscriptionId - Subscription ID
     * @param {string} status - New status
     * @param {string} reason - Reason for change
     * @returns {Promise<Subscription>}
     */
    async updateSubscriptionStatus(subscriptionId, status, reason = '') {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            subscription.updateStatus(status, reason);
            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to update subscription status:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     * @param {string} subscriptionId - Subscription ID
     * @param {string} reason - Cancellation reason
     * @param {Date} effectiveDate - When cancellation takes effect
     * @returns {Promise<Subscription>}
     */
    async cancelSubscription(subscriptionId, reason = '', effectiveDate = null) {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            subscription.cancel(reason, effectiveDate);
            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            throw error;
        }
    }

    /**
     * Renew subscription
     * @param {string} subscriptionId - Subscription ID
     * @returns {Promise<Subscription>}
     */
    async renewSubscription(subscriptionId) {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            subscription.renew();
            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to renew subscription:', error);
            throw error;
        }
    }

    /**
     * Change subscription plan
     * @param {string} subscriptionId - Subscription ID
     * @param {string} newPlanId - New plan ID
     * @param {string} billingCycle - Billing cycle
     * @returns {Promise<Subscription>}
     */
    async changePlan(subscriptionId, newPlanId, billingCycle = 'monthly') {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            subscription.changePlan(newPlanId, billingCycle);
            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to change subscription plan:', error);
            throw error;
        }
    }

    /**
     * Get active subscriptions count
     * @returns {Promise<number>}
     */
    async getActiveSubscriptionsCount() {
        try {
            const activeSubscriptions = await this.listSubscriptions({
                status: 'active',
                limit: 10000
            });
            return activeSubscriptions.length;
        } catch (error) {
            console.error('Failed to get active subscriptions count:', error);
            throw error;
        }
    }

    /**
     * Get subscription statistics
     * @returns {Promise<Object>}
     */
    async getSubscriptionStatistics() {
        try {
            const allSubscriptions = await this.listSubscriptions({ limit: 10000 });

            const stats = {
                total: allSubscriptions.length,
                byStatus: {},
                byPlan: {},
                totalRevenue: 0,
                averageRevenue: 0
            };

            let totalRevenue = 0;

            allSubscriptions.forEach(subscription => {
                // Count by status
                stats.byStatus[subscription.status] = (stats.byStatus[subscription.status] || 0) + 1;

                // Count by plan
                stats.byPlan[subscription.planId] = (stats.byPlan[subscription.planId] || 0) + 1;

                // Calculate revenue (mock calculation)
                if (subscription.status === 'active') {
                    totalRevenue += subscription.amount || 0;
                }
            });

            stats.totalRevenue = totalRevenue;
            stats.averageRevenue = allSubscriptions.length > 0 ? totalRevenue / allSubscriptions.length : 0;

            return stats;
        } catch (error) {
            console.error('Failed to get subscription statistics:', error);
            throw error;
        }
    }

    /**
     * Find expiring subscriptions
     * @param {number} daysAhead - Days ahead to check
     * @returns {Promise<Subscription[]>}
     */
    async findExpiringSubscriptions(daysAhead = 7) {
        try {
            const allSubscriptions = await this.listSubscriptions({
                status: 'active',
                limit: 10000
            });

            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() + daysAhead);

            return allSubscriptions.filter(subscription => {
                if (!subscription.currentPeriodEnd) return false;
                const endDate = new Date(subscription.currentPeriodEnd);
                return endDate <= checkDate;
            });
        } catch (error) {
            console.error('Failed to find expiring subscriptions:', error);
            throw error;
        }
    }

    /**
     * Process subscription renewal
     * @param {string} subscriptionId - Subscription ID
     * @param {Object} paymentResult - Payment processing result
     * @returns {Promise<Subscription>}
     */
    async processRenewal(subscriptionId, paymentResult) {
        try {
            const subscription = await this.getSubscription(subscriptionId);
            if (!subscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            if (paymentResult.success) {
                subscription.renew();
                subscription.addPayment(paymentResult);
            } else {
                subscription.updateStatus('payment_failed', 'Payment processing failed');
            }

            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to process subscription renewal:', error);
            throw error;
        }
    }

    /**
     * Delete subscription (admin only)
     * @param {string} subscriptionId - Subscription ID
     * @returns {Promise<boolean>}
     */
    async deleteSubscription(subscriptionId) {
        try {
            const existingSubscription = await this.getSubscription(subscriptionId);
            if (!existingSubscription) {
                throw new NotFoundError(`Subscription not found: ${subscriptionId}`);
            }

            const command = this.snl.removeSubscriptionSNL(subscriptionId);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Subscription deleted: ${subscriptionId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete subscription:', error);
            throw error;
        }
    }
}

module.exports = SubscriptionManager;