// src/data/snl/subscription_snl.js

/**
 * SubscriptionSNL - SNL commands for Subscription entity
 */
class SubscriptionSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * Check if subscriptions structure exists
     * @returns {string}
     */
    checkSubscriptionsStructureExistsSNL() {
        return 'list(structure)\nvalues("subscriptions")\non(main.core)';
    }

    /**
     * Create subscriptions structure
     * @returns {string}
     */
    createSubscriptionsStructureSNL() {
        return 'set(structure)\nvalues("subscriptions", {})\non(main.core.subscriptions)';
    }

    /**
     * Get subscription by user email SNL
     * @param {string} userEmail - User email
     * @returns {string}
     */
    getSubscriptionSNL(userEmail) {
        if (!userEmail) {
            throw new Error('User email is required');
        }
        return `view(structure)\nvalues("${userEmail}")\non(main.core.subscriptions)`;
    }

    /**
     * Set subscription SNL
     * @param {string} userEmail - User email
     * @param {Object} subscriptionData - Subscription data
     * @returns {string}
     */
    setSubscriptionSNL(userEmail, subscriptionData) {
        if (!userEmail || !subscriptionData) {
            throw new Error('User email and subscription data are required');
        }
        const dataJson = JSON.stringify(subscriptionData);
        return `set(structure)\nvalues("${userEmail}", ${dataJson})\non(main.core.subscriptions)`;
    }

    /**
     * Get all subscriptions SNL
     * @returns {string}
     */
    getAllSubscriptionsSNL() {
        return 'view(structure)\non(main.core.subscriptions)';
    }

    /**
     * Get subscriptions by plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    getSubscriptionsByPlanSNL(planId) {
        if (!planId) {
            throw new Error('Plan ID is required');
        }
        return `search(structure)\nvalues("plan_id", "${planId}")\non(main.core.subscriptions)`;
    }

    /**
     * Remove subscription SNL
     * @param {string} userEmail - User email
     * @returns {string}
     */
    removeSubscriptionSNL(userEmail) {
        if (!userEmail) {
            throw new Error('User email is required');
        }
        return `remove(structure)\nvalues("${userEmail}")\non(main.core.subscriptions)`;
    }

    /**
     * Search subscriptions SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchSubscriptionsSNL(searchTerm) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        return `search(structure)\nvalues("${searchTerm}")\non(main.core.subscriptions)`;
    }

    /**
     * Get active subscriptions SNL
     * @returns {string}
     */
    getActiveSubscriptionsSNL() {
        return 'search(structure)\nvalues("status", "active")\non(main.core.subscriptions)';
    }

    /**
     * Build subscription data object
     * @param {Object} subscription - Subscription entity
     * @returns {Object}
     */
    buildSubscriptionData(subscription) {
        return {
            plan_id: subscription.plan_id,
            status: subscription.status,
            created_at: subscription.created_at,
            updated_at: subscription.updated_at,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            payment_info: subscription.payment_info || {},
            metadata: subscription.metadata || {}
        };
    }

    /**
     * Parse structure exists response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {boolean}
     */
    parseStructureExistsResponse(response) {
        if (!response) return false;

        if (Array.isArray(response)) {
            return response.includes('subscriptions');
        }

        if (typeof response === 'object') {
            return Object.keys(response).includes('subscriptions');
        }

        return false;
    }

    /**
     * Parse subscription response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object|null}
     */
    parseSubscriptionResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return response;
    }

    /**
     * Parse all subscriptions response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object}
     */
    parseAllSubscriptionsResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        return response;
    }

    /**
     * Parse subscription search response
     * @param {Object} response - Response from NeuronDB
     * @returns {Array}
     */
    parseSubscriptionSearchResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const subscriptions = [];
        for (const [userEmail, subscriptionData] of Object.entries(response)) {
            subscriptions.push({
                user_email: userEmail,
                ...subscriptionData
            });
        }

        return subscriptions;
    }
}

module.exports = SubscriptionSNL;