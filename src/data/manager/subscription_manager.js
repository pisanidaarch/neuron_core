// src/data/manager/subscription_manager.js

const Subscription = require('../../cross/entity/subscription');
const SubscriptionSNL = require('../snl/subscription_snl');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * SubscriptionManager - Manages Subscription entity operations
 */
class SubscriptionManager {
    constructor(aiKey) {
        this.aiKey = aiKey;
        this.subscriptionSNL = new SubscriptionSNL();
        this.sender = new NeuronDBSender();
    }

    /**
     * Initialize subscriptions structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.subscriptionSNL.checkSubscriptionsStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiKey);

            const exists = this.subscriptionSNL.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.subscriptionSNL.createSubscriptionsStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiKey);
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
                throw new Error(`Subscription validation failed: ${validation.errors.join(', ')}`);
            }

            const subscriptionData = this.subscriptionSNL.buildSubscriptionData(subscription);
            const command = this.subscriptionSNL.setSubscriptionSNL(subscription.user_email, subscriptionData);
            await this.sender.executeSNL(command, this.aiKey);

            return subscription;
        } catch (error) {
            console.error('Failed to save subscription:', error);
            throw error;
        }
    }

    /**
     * Get subscription by user email
     * @param {string} userEmail - User email
     * @returns {Promise<Subscription|null>}
     */
    async getSubscription(userEmail) {
        try {
            const command = this.subscriptionSNL.getSubscriptionSNL(userEmail);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const subscriptionData = this.subscriptionSNL.parseSubscriptionResponse(response);
            if (!subscriptionData) {
                return null;
            }

            return Subscription.fromNeuronDB(userEmail, subscriptionData);
        } catch (error) {
            console.error('Failed to get subscription:', error);
            return null;
        }
    }

    /**
     * Get all subscriptions
     * @returns {Promise<Subscription[]>}
     */
    async getAllSubscriptions() {
        try {
            const command = this.subscriptionSNL.getAllSubscriptionsSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            const subscriptionsData = this.subscriptionSNL.parseAllSubscriptionsResponse(response);
            const subscriptions = [];

            for (const [userEmail, subscriptionData] of Object.entries(subscriptionsData)) {
                const subscription = Subscription.fromNeuronDB(userEmail, subscriptionData);
                subscriptions.push(subscription);
            }

            return subscriptions;
        } catch (error) {
            console.error('Failed to get all subscriptions:', error);
            return [];
        }
    }

    /**
     * Get active subscriptions only
     * @returns {Promise<Subscription[]>}
     */
    async getActiveSubscriptions() {
        try {
            const allSubscriptions = await this.getAllSubscriptions();
            return allSubscriptions.filter(subscription => subscription.isActive());
        } catch (error) {
            console.error('Failed to get active subscriptions:', error);
            return [];
        }
    }

    /**
     * Get subscriptions by plan
     * @param {string} planId - Plan ID
     * @returns {Promise<Subscription[]>}
     */
    async getSubscriptionsByPlan(planId) {
        try {
            const command = this.subscriptionSNL.getSubscriptionsByPlanSNL(planId);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const searchResults = this.subscriptionSNL.parseSearchResponse(response);
            const subscriptions = [];

            for (const subscriptionData of searchResults) {
                const subscription = Subscription.fromNeuronDB(subscriptionData.user_email, subscriptionData);
                subscriptions.push(subscription);
            }

            return subscriptions;
        } catch (error) {
            console.error('Failed to get subscriptions by plan:', error);
            return [];
        }
    }

    /**
     * Get list of user emails with subscriptions
     * @returns {Promise<string[]>}
     */
    async getSubscriptionList() {
        try {
            const command = this.subscriptionSNL.getListSubscriptionsSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.subscriptionSNL.parseSubscriptionsListResponse(response);
        } catch (error) {
            console.error('Failed to get subscription list:', error);
            return [];
        }
    }

    /**
     * Search subscriptions
     * @param {string} searchTerm - Search term
     * @returns {Promise<Subscription[]>}
     */
    async searchSubscriptions(searchTerm) {
        try {
            const command = this.subscriptionSNL.searchSubscriptionsSNL(searchTerm);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const searchResults = this.subscriptionSNL.parseSearchResponse(response);
            const subscriptions = [];

            for (const subscriptionData of searchResults) {
                const subscription = Subscription.fromNeuronDB(subscriptionData.user_email, subscriptionData);
                subscriptions.push(subscription);
            }

            return subscriptions;
        } catch (error) {
            console.error('Failed to search subscriptions:', error);
            return [];
        }
    }

    /**
     * Remove subscription
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async removeSubscription(userEmail) {
        try {
            const command = this.subscriptionSNL.removeSubscriptionSNL(userEmail);
            await this.sender.executeSNL(command, this.aiKey);
            return true;
        } catch (error) {
            console.error('Failed to remove subscription:', error);
            return false;
        }
    }

    /**
     * Check if subscription exists
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async subscriptionExists(userEmail) {
        const subscription = await this.getSubscription(userEmail);
        return subscription !== null;
    }

    /**
     * Create subscription
     * @param {string} userEmail - User email
     * @param {string} planId - Plan ID
     * @param {Object} paymentInfo - Payment information
     * @returns {Promise<Subscription>}
     */
    async createSubscription(userEmail, planId, paymentInfo = {}) {
        try {
            const subscription = new Subscription({
                user_email: userEmail,
                plan_id: planId,
                payment_info: paymentInfo,
                status: 'active'
            });

            return await this.saveSubscription(subscription);
        } catch (error) {
            console.error('Failed to create subscription:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription
     * @param {string} userEmail - User email
     * @param {Date} endDate - Optional end date
     * @returns {Promise<boolean>}
     */
    async cancelSubscription(userEmail, endDate = null) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.cancel(endDate);
            await this.saveSubscription(subscription);
            return true;
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            return false;
        }
    }

    /**
     * Change subscription plan
     * @param {string} userEmail - User email
     * @param {string} newPlanId - New plan ID
     * @returns {Promise<boolean>}
     */
    async changeSubscriptionPlan(userEmail, newPlanId) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.changePlan(newPlanId);
            await this.saveSubscription(subscription);
            return true;
        } catch (error) {
            console.error('Failed to change subscription plan:', error);
            return false;
        }
    }

    /**
     * Renew subscription
     * @param {string} userEmail - User email
     * @param {string} newPlanId - Optional new plan ID
     * @param {Date} newEndDate - Optional new end date
     * @returns {Promise<boolean>}
     */
    async renewSubscription(userEmail, newPlanId = null, newEndDate = null) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.renew(newPlanId, newEndDate);
            await this.saveSubscription(subscription);
            return true;
        } catch (error) {
            console.error('Failed to renew subscription:', error);
            return false;
        }
    }

    /**
     * Add user to subscription
     * @param {string} userEmail - User email
     * @param {number} maxUsers - Maximum users allowed by plan
     * @returns {Promise<boolean>}
     */
    async addUserToSubscription(userEmail, maxUsers) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const success = subscription.addUser(maxUsers);
            if (success) {
                await this.saveSubscription(subscription);
            }
            return success;
        } catch (error) {
            console.error('Failed to add user to subscription:', error);
            return false;
        }
    }

    /**
     * Remove user from subscription
     * @param {string} userEmail - User email
     * @returns {Promise<boolean>}
     */
    async removeUserFromSubscription(userEmail) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.removeUser();
            await this.saveSubscription(subscription);
            return true;
        } catch (error) {
            console.error('Failed to remove user from subscription:', error);
            return false;
        }
    }

    /**
     * Update user count
     * @param {string} userEmail - User email
     * @param {number} count - New user count
     * @returns {Promise<boolean>}
     */
    async updateUserCount(userEmail, count) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            subscription.updateUserCount(count);
            await this.saveSubscription(subscription);
            return true;
        } catch (error) {
            console.error('Failed to update user count:', error);
            return false;
        }
    }

    /**
     * Get subscription statistics
     * @returns {Promise<Object>}
     */
    async getSubscriptionStats() {
        try {
            const command = this.subscriptionSNL.getSubscriptionStatsSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.subscriptionSNL.parseSubscriptionStats(response);
        } catch (error) {
            console.error('Failed to get subscription stats:', error);
            return {
                total: 0,
                active: 0,
                cancelled: 0,
                expired: 0
            };
        }
    }

    /**
     * Check if subscription allows more users
     * @param {string} userEmail - User email
     * @param {number} maxUsers - Maximum users allowed by plan
     * @returns {Promise<boolean>}
     */
    async canAddUser(userEmail, maxUsers) {
        try {
            const subscription = await this.getSubscription(userEmail);
            if (!subscription) {
                return false;
            }

            return subscription.canAddUser(maxUsers);
        } catch (error) {
            console.error('Failed to check if can add user:', error);
            return false;
        }
    }
}

module.exports = SubscriptionManager;