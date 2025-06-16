// src/data/snl/plan_snl.js

/**
 * PlanSNL - SNL commands for Plan entity operations
 */
class PlanSNL {
    constructor() {
        this.namespace = 'main.core';
        this.entityName = 'plans';
    }

    /**
     * Check if plans structure exists
     * @returns {string}
     */
    checkPlansStructureExistsSNL() {
        return `list(structure)\nvalues("${this.entityName}")\non(${this.namespace})`;
    }

    /**
     * Create plans structure if not exists
     * @returns {string}
     */
    createPlansStructureSNL() {
        return `set(structure)\nvalues("${this.entityName}", {})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Set plan SNL
     * @param {string} planId - Plan ID
     * @param {Object} planData - Plan data
     * @returns {string}
     */
    setPlanSNL(planId, planData) {
        return `set(structure)\nvalues("${planId}", ${JSON.stringify(planData)})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    getPlanSNL(planId) {
        return `view(structure)\nvalues("${planId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * List plans SNL
     * @returns {string}
     */
    listPlansSNL() {
        return `list(structure)\nvalues("*")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Remove plan SNL
     * @param {string} planId - Plan ID
     * @returns {string}
     */
    removePlanSNL(planId) {
        return `remove(structure)\nvalues("${planId}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Search plans SNL
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    searchPlansSNL(searchTerm) {
        return `search(structure)\nvalues("${searchTerm}")\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get active plans SNL
     * @returns {string}
     */
    getActivePlansSNL() {
        return `search(structure)\nvalues("isActive":true)\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get visible plans SNL
     * @returns {string}
     */
    getVisiblePlansSNL() {
        return `search(structure)\nvalues("isVisible":true)\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get plans by price range SNL
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @param {string} cycle - Billing cycle (monthly|yearly)
     * @returns {string}
     */
    getPlansByPriceRangeSNL(minPrice, maxPrice, cycle = 'monthly') {
        const priceField = cycle === 'yearly' ? 'price.yearly' : 'price.monthly';
        return `search(structure)\nvalues("${priceField}":{"$gte":${minPrice},"$lte":${maxPrice}})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Build plan data for storage
     * @param {Plan} plan - Plan entity
     * @returns {Object}
     */
    buildPlanData(plan) {
        return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            features: plan.features,
            limits: plan.limits,
            isActive: plan.isActive,
            isVisible: plan.isVisible,
            sortOrder: plan.sortOrder,
            metadata: plan.metadata,
            trialDays: plan.trialDays,
            setupFee: plan.setupFee,
            aiName: plan.aiName,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
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

        // If plans entity exists, response should contain it
        return Object.prototype.hasOwnProperty.call(response, this.entityName);
    }

    /**
     * Parse plans list response
     * @param {Object} response - SNL response
     * @returns {Array<string>}
     */
    parsePlansList(response) {
        if (!response || typeof response !== 'object') {
            return [];
        }

        // Extract plan IDs from response, excluding the entity name itself
        return Object.keys(response).filter(key => key !== this.entityName);
    }

    /**
     * Parse plan data response
     * @param {Object} response - SNL response
     * @returns {Object}
     */
    parsePlanData(response) {
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
     * Validate plan ID
     * @param {string} planId - Plan ID to validate
     * @throws {Error} If plan ID is invalid
     */
    validatePlanId(planId) {
        if (!planId || typeof planId !== 'string') {
            throw new Error('Plan ID must be a non-empty string');
        }

        if (planId.length > 50) {
            throw new Error('Plan ID must be 50 characters or less');
        }

        // Check for valid characters (alphanumeric, underscore, hyphen)
        const validIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validIdPattern.test(planId)) {
            throw new Error('Plan ID can only contain letters, numbers, underscores, and hyphens');
        }
    }

    /**
     * Build plan search filters
     * @param {Object} filters - Search filters
     * @returns {string} Search pattern
     */
    buildSearchFilters(filters) {
        const searchTerms = [];

        if (filters.isActive !== undefined) {
            searchTerms.push(`"isActive":${filters.isActive}`);
        }

        if (filters.isVisible !== undefined) {
            searchTerms.push(`"isVisible":${filters.isVisible}`);
        }

        if (filters.currency) {
            searchTerms.push(`"currency":"${filters.currency}"`);
        }

        if (filters.hasTrialDays) {
            searchTerms.push(`"trialDays":{"$gt":0}`);
        }

        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            const cycle = filters.cycle || 'monthly';
            const priceField = cycle === 'yearly' ? 'price.yearly' : 'price.monthly';
            searchTerms.push(`"${priceField}":{"$gte":${filters.minPrice},"$lte":${filters.maxPrice}}`);
        }

        if (filters.hasFeature) {
            searchTerms.push(`"features":"${filters.hasFeature}"`);
        }

        return searchTerms.length > 0 ? searchTerms.join(' AND ') : '*';
    }

    /**
     * Parse plan statistics from response
     * @param {Object} response - SNL response containing multiple plans
     * @returns {Object} Statistics object
     */
    parsePlanStatistics(response) {
        if (!response || typeof response !== 'object') {
            return {
                total: 0,
                active: 0,
                visible: 0,
                byPriceRange: {},
                averagePrice: { monthly: 0, yearly: 0 }
            };
        }

        const stats = {
            total: 0,
            active: 0,
            visible: 0,
            byPriceRange: {
                free: 0,
                basic: 0,       // 0-50
                standard: 0,    // 50-150
                premium: 0,     // 150-500
                enterprise: 0   // 500+
            },
            averagePrice: { monthly: 0, yearly: 0 },
            totalRevenue: { monthly: 0, yearly: 0 }
        };

        let totalMonthlyPrice = 0;
        let totalYearlyPrice = 0;

        for (const [key, value] of Object.entries(response)) {
            if (key !== this.entityName && typeof value === 'object' && value !== null) {
                stats.total++;

                if (value.isActive) stats.active++;
                if (value.isVisible) stats.visible++;

                // Price range categorization
                const monthlyPrice = value.price?.monthly || 0;
                if (monthlyPrice === 0) {
                    stats.byPriceRange.free++;
                } else if (monthlyPrice <= 50) {
                    stats.byPriceRange.basic++;
                } else if (monthlyPrice <= 150) {
                    stats.byPriceRange.standard++;
                } else if (monthlyPrice <= 500) {
                    stats.byPriceRange.premium++;
                } else {
                    stats.byPriceRange.enterprise++;
                }

                // Calculate totals for averages
                totalMonthlyPrice += monthlyPrice;
                totalYearlyPrice += (value.price?.yearly || 0);

                // Revenue calculation (for active and visible plans)
                if (value.isActive && value.isVisible) {
                    stats.totalRevenue.monthly += monthlyPrice;
                    stats.totalRevenue.yearly += (value.price?.yearly || 0);
                }
            }
        }

        // Calculate averages
        if (stats.total > 0) {
            stats.averagePrice.monthly = Math.round((totalMonthlyPrice / stats.total) * 100) / 100;
            stats.averagePrice.yearly = Math.round((totalYearlyPrice / stats.total) * 100) / 100;
        }

        return stats;
    }

    /**
     * Build plan feature comparison SNL
     * @param {Array<string>} planIds - Plan IDs to compare
     * @returns {string}
     */
    buildFeatureComparisonSNL(planIds) {
        const planFilter = planIds.map(id => `"${id}"`).join(',');
        return `view(structure)\nvalues(${planFilter})\non(${this.namespace}.${this.entityName})`;
    }

    /**
     * Get plans sorted by price SNL
     * @param {string} cycle - Billing cycle (monthly|yearly)
     * @param {string} order - Sort order (asc|desc)
     * @returns {string}
     */
    getPlansSortedByPriceSNL(cycle = 'monthly', order = 'asc') {
        // Note: This would require enhanced SNL sorting capabilities
        // For now, we return all plans and sort in JavaScript
        return this.listPlansSNL();
    }

    /**
     * Get recommended plans SNL
     * @param {string} userType - User type (individual|team|enterprise)
     * @returns {string}
     */
    getRecommendedPlansSNL(userType) {
        // This would filter plans based on user type recommendations
        // For now, we return all active and visible plans
        return `search(structure)\nvalues("isActive":true,"isVisible":true)\non(${this.namespace}.${this.entityName})`;
    }
}

module.exports = PlanSNL;