
// src/data/snl/plan_snl.js

/**
 * PlanSNL - SNL commands for Plan entity
 */
class PlanSNL {
    constructor() {
        // SNL commands are defined as methods
    }

    /**
     * Get plans list SNL
     * @returns {string}
     */
    getListPlansSNL() {
        return 'list(structure)\nvalues("*")\non(main.core.plans)';
    }

    /**
     * Get specific plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    getPlanSNL(planId) {
        if (!planId) {
            throw new Error('Plan ID is required');
        }
        return `one(structure, id)\nvalues("${planId}")\non(main.core.plans)`;
    }

    /**
     * Create/Update plan SNL
     * @param {string} planId - Plan ID
     * @param {Object} planData - Plan data
     * @returns {string}
     */
    setPlanSNL(planId, planData) {
        if (!planId || !planData) {
            throw new Error('Plan ID and data are required');
        }
        const planDataJson = JSON.stringify(planData);
        return `set(structure)\nvalues("${planId}", ${planDataJson})\non(main.core.plans)`;
    }

    /**
     * Remove plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    removePlanSNL(planId) {
        if (!planId) {
            throw new Error('Plan ID is required');
        }
        return `remove(structure)\nvalues("${planId}")\non(main.core.plans)`;
    }

    /**
     * Search plans SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchPlansSNL(searchTerm) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        return `search(structure)\nvalues("${searchTerm}")\non(main.core.plans)`;
    }

    /**
     * Get all plans with their data
     * @returns {string}
     */
    getAllPlansSNL() {
        return 'view(structure)\non(main.core.plans)';
    }

    /**
     * Get active plans only
     * @returns {string}
     */
    getActivePlansSNL() {
        return 'search(structure)\nvalues("active", true)\non(main.core.plans)';
    }

    /**
     * Get plans by billing cycle
     * @param {string} billingCycle - Billing cycle (monthly, yearly)
     * @returns {string}
     */
    getPlansByBillingCycleSNL(billingCycle) {
        if (!billingCycle) {
            throw new Error('Billing cycle is required');
        }
        return `search(structure)\nvalues("${billingCycle}")\non(main.core.plans)`;
    }

    /**
     * Parse plans list response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {Array} Array of plan IDs
     */
    parsePlansListResponse(response) {
        if (!response) return [];

        if (Array.isArray(response)) {
            return response;
        }

        if (typeof response === 'object') {
            return Object.keys(response);
        }

        return [];
    }

    /**
     * Parse single plan response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object|null} Plan data
     */
    parsePlanResponse(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return {
            name: response.name,
            description: response.description,
            price: response.price,
            currency: response.currency || 'BRL',
            billing_cycle: response.billing_cycle || 'monthly',
            limits: response.limits || {
                max_users: 1,
                max_tokens: 100000,
                max_commands: 1000,
                max_workflows: 100
            },
            features: response.features || [],
            active: response.active !== undefined ? response.active : true,
            created_at: response.created_at,
            updated_at: response.updated_at
        };
    }

    /**
     * Parse all plans response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object} Object with plan ID as key and plan data as value
     */
    parseAllPlansResponse(response) {
        if (!response || typeof response !== 'object') {
            return {};
        }

        return response;
    }

    /**
     * Parse search results
     * @param {Object} response - Response from NeuronDB
     * @returns {Array} Array of matched plans
     */
    parseSearchResponse(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const results = [];
        for (const [planId, planData] of Object.entries(response)) {
            results.push({
                id: planId,
                ...planData
            });
        }

        return results;
    }

    /**
     * Build plan data for NeuronDB
     * @param {Object} plan - Plan entity
     * @returns {Object} Plan data formatted for NeuronDB
     */
    buildPlanData(plan) {
        return {
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            billing_cycle: plan.billing_cycle,
            limits: plan.limits,
            features: plan.features,
            active: plan.active,
            created_at: plan.created_at,
            updated_at: plan.updated_at
        };
    }

    /**
     * Create initial plans structure if it doesn't exist
     * @returns {string}
     */
    createPlansStructureSNL() {
        return 'set(structure)\nvalues("plans", {})\non(main.core.plans)';
    }

    /**
     * Check if plans structure exists
     * @returns {string}
     */
    checkPlansStructureExistsSNL() {
        return 'list(structure)\nvalues("plans")\non(main.core)';
    }

    /**
     * Parse structure exists response
     * @param {Array|Object} response - Response from NeuronDB
     * @returns {boolean} True if structure exists
     */
    parseStructureExistsResponse(response) {
        if (Array.isArray(response)) {
            return response.includes('plans');
        }

        if (typeof response === 'object') {
            return Object.keys(response).includes('plans');
        }

        return false;
    }

    /**
     * Get plan pricing information
     * @returns {string}
     */
    getPlanPricingSNL() {
        return 'view(structure)\non(main.core.plans)';
    }

    /**
     * Parse plan pricing response
     * @param {Object} response - Response from NeuronDB
     * @returns {Array} Array of plan pricing information
     */
    parsePlanPricing(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        const pricing = [];
        for (const [planId, planData] of Object.entries(response)) {
            if (planData.active) {
                pricing.push({
                    id: planId,
                    name: planData.name,
                    price: planData.price,
                    currency: planData.currency || 'BRL',
                    billing_cycle: planData.billing_cycle || 'monthly',
                    features: planData.features || []
                });
            }
        }

        return pricing.sort((a, b) => a.price - b.price);
    }

    /**
     * Get plan limits information
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    getPlanLimitsSNL(planId) {
        if (!planId) {
            throw new Error('Plan ID is required');
        }
        return `one(structure, id)\nvalues("${planId}")\non(main.core.plans)`;
    }

    /**
     * Parse plan limits response
     * @param {Object} response - Response from NeuronDB
     * @returns {Object|null} Plan limits
     */
    parsePlanLimits(response) {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return response.limits || {
            max_users: 1,
            max_tokens: 100000,
            max_commands: 1000,
            max_workflows: 100
        };
    }
}

module.exports = PlanSNL;