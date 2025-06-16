// src/data/snl/subscription_snl.js

/**
 * SubscriptionSNL - SNL commands for Subscription entity operations
 */
class SubscriptionSNL {
    constructor() {
        this.namespace = 'main.core';
        this.entityName = 'subscriptions';
    }

    /**
     * Check if subscriptions structure exists
     * @returns {string}
     */
    checkSubscriptionsStructureExistsSNL() {
        return `list(structure)\nvalues("${this.entityName}")\non(${this.namespace})`;
    }

    /**
     * Create subscriptions structure if not exists
     * @returns {string}
     */
    createSubscriptionsStructureSNL() {
        return `set(structure)\nvalues("${this.entityName}", {})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Set subscription SNL
     * @param {string} subscriptionId - Subscription ID
     * @param {Object} subscriptionData - Subscription data
     * @returns {string}
     */
    setSubscriptionSNL(subscriptionId, subscriptionData) {
        return `set(structure)\nvalues("${subscriptionId}", ${JSON.stringify(subscriptionData)})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get subscription SNL
     * @param {string} subscriptionId - Subscription ID
     * @returns {string}
     */
    getSubscriptionSNL(subscriptionId) {
        return `view(structure)\nvalues("${subscriptionId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get subscription by user email SNL
     * @param {string} userEmail - User email
     * @returns {string}
     */
    getSubscriptionByUserSNL(userEmail) {
        return `search(structure)\nvalues("${userEmail}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * List subscriptions SNL
     * @returns {string}
     */
    listSubscriptionsSNL() {
        return `list(structure)\nvalues("*")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Remove subscription SNL
     * @param {string} subscriptionId - Subscription ID
     * @returns {string}
     */
    removeSubscriptionSNL(subscriptionId) {
        return `remove(structure)\nvalues("${subscriptionId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Search subscriptions SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchSubscriptionsSNL(searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get subscriptions by status SNL
     * @param {string} status - Subscription status
     * @returns {string}
     */
    getSubscriptionsByStatusSNL(status) {
        return `search(structure)\nvalues("${status}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get subscriptions by plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    getSubscriptionsByPlanSNL(planId) {
        return `search(structure)\nvalues("${planId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get expiring subscriptions SNL
     * @param {string} beforeDate - Date before which subscriptions expire
     * @returns {string}
     */
    getExpiringSubscriptionsSNL(beforeDate) {
        return `search(structure)\nvalues("${beforeDate}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Build subscription data for storage
     * @param {Subscription} subscription - Subscription entity
     * @returns {Object}
     */
    buildSubscriptionData(subscription) {
        return {
            id: subscription.id,
            userEmail: subscription.userEmail,
            planId: subscription.planId,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            amount: subscription.amount,
            currency: subscription.currency,
            paymentMethod: subscription.paymentMethod,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.nextBillingDate,
            trialEnd: subscription.trialEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            cancelledAt: subscription.cancelledAt,
            cancellationReason: subscription.cancellationReason,
            autoRenew: subscription.autoRenew,
            metadata: subscription.metadata,
            payments: subscription.payments,
            aiName: subscription.aiName,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt
        };
    }

    /**
     * Parse structure exists response
     * @param {Object} response - SNL response
     * @returns {boolean}
     */
    parseStructureExistsResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }

        // If subscriptions entity exists, response should contain it
        return Object.prototype.hasOwnProperty.call(response, this.entityName);
    }

    /**
     * Parse subscriptions list response
     * @param {Object} response - SNL response
     * @returns {Array<string>}
     */
    parseSubscriptionsList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        // Extract subscription IDs from response, excluding the entity name itself
        return Object.keys(response).filter(key => key !== this.entityName);
    }

    /**
     * Parse subscription data response
     * @param {Object} response - SNL response
     * @returns {Object}
     */
    parseSubscriptionData(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        // Return the first non-entity object found
        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                return value;
            }
        }

        return null;
    }

    /**
     * Validate subscription ID
     * @param {string} subscriptionId - Subscription ID to validate
     * @throws {Error} If subscription ID is invalid
     */
    validateSubscriptionId(subscriptionId) {
        if (!subscriptionId || typeof subscriptionId !== 'string') {
            throw new Error('Subscription ID must be a non-empty string');
        }

        if (subscriptionId.length > 100) {
            throw new Error('Subscription ID must be 100 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validIdPattern.test(subscriptionId)) {
            throw new Error('Subscription ID can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Build subscription search filters
     * @param {Object} filters - Search filters
     * @returns {string} Search pattern
     */
    buildSearchFilters(filters) {
        const searchTerms = [];

        if (filters.status) {
            searchTerms.push(`"status":"${filters.status}"`);
        }

        if (filters.planId) {
            searchTerms.push(`"planId":"${filters.planId}"`);
        }

        if (filters.userEmail) {
            searchTerms.push(`"userEmail":"${filters.userEmail}"`);
        }

        if (filters.billingCycle) {
            searchTerms.push(`"billingCycle":"${filters.billingCycle}"`);
        }

        if (filters.autoRenew !== undefined) {
            searchTerms.push(`"autoRenew":${filters.autoRenew}`);
        }

        return searchTerms.length > 0 ? searchTerms.join(' AND ') : '*';
    }

    /**
     * Parse subscription statistics from response
     * @param {Object} response - SNL response containing multiple subscriptions
     * @returns {Object} Statistics object
     */
    parseSubscriptionStatistics(response) {
        if (!response || typeof response !== 'object') {
            return {
                total: 0,
                byStatus: {},
                byPlan: {},
                totalRevenue: 0
            };
        }

        const stats = {
            total: 0,
            byStatus: {},
            byPlan: {},
            totalRevenue: 0
        };

        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                stats.total++;

                // Count by status
                const status = value.status || 'unknown';
                stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

                // Count by plan
                const planId = value.planId || 'unknown';
                stats.byPlan[planId] = (stats.byPlan[planId] || 0) + 1;

                // Calculate revenue for active subscriptions
                if (status === 'active' && value.amount) {
                    stats.totalRevenue += value.amount;
                }
            }
        }

        return stats;
    }

    /**
     * Build date range filter for subscriptions
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} dateField - Date field to filter on
     * @returns {string} Date filter pattern
     */
    buildDateRangeFilter(startDate, endDate, dateField = 'createdAt') {
        const start = startDate.toISOString();
        const end = endDate.toISOString();

        return `"${dateField}":{"$gte":"${start}","$lte":"${end}"}`;
    }

    /**
     * Get subscription payment history SNL
     * @param {string} subscriptionId - Subscription ID
     * @returns {string}
     */
    getSubscriptionPaymentsSNL(subscriptionId) {
        return `view(structure)\nvalues("${subscriptionId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Update subscription payment SNL
     * @param {string} subscriptionId - Subscription ID
     * @param {Object} paymentData - Payment data to add
     * @returns {string}
     */
    addSubscriptionPaymentSNL(subscriptionId, paymentData) {
        // This would need to append to the payments array
        // For now, we'll treat it as a full subscription update
        return `set(structure)\nvalues("${subscriptionId}", ${JSON.stringify(paymentData)})\non(${this.namespace}.${this.entityName})`;
    }
}

module.exports = SubscriptionSNL;