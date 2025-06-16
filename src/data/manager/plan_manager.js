// src/data/manager/plan_manager.js

const Plan = require('../../cross/entity/plan');
const PlanSNL = require('../snl/plan_snl');
const AISender = require('../neuron_db/ai_sender');
const { ValidationError, NotFoundError } = require('../../cross/entity/errors');

/**
 * PlanManager - Manages Plan entity operations
 */
class PlanManager {
    constructor(aiToken) {
        this.aiToken = aiToken;
        this.snl = new PlanSNL();
        this.sender = new AISender();
    }

    /**
     * Initialize plans structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.snl.checkPlansStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiToken);

            const exists = this.snl.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.snl.createPlansStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiToken);
                console.log('✅ Plans structure created');
            }
        } catch (error) {
            console.error('Failed to initialize plans structure:', error);
            throw error;
        }
    }

    /**
     * Create or update plan
     * @param {Plan} plan - Plan entity
     * @returns {Promise<Plan>}
     */
    async savePlan(plan) {
        try {
            const validation = plan.validate();
            if (!validation.valid) {
                throw new ValidationError(`Plan validation failed: ${validation.errors.join(', ')}`);
            }

            plan.updatedAt = new Date().toISOString();
            const planData = this.snl.buildPlanData(plan);
            const command = this.snl.setPlanSNL(plan.id, planData);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Plan saved: ${plan.id}`);
            return plan;
        } catch (error) {
            console.error('Failed to save plan:', error);
            throw error;
        }
    }

    /**
     * Get plan by ID
     * @param {string} planId - Plan ID
     * @returns {Promise<Plan|null>}
     */
    async getPlan(planId) {
        try {
            const command = this.snl.getPlanSNL(planId);
            const response = await this.sender.executeSNL(command, this.aiToken);

            if (!response || Object.keys(response).length === 0) {
                return null;
            }

            const planData = this.snl.parsePlanData(response);
            return Plan.fromObject(planData);
        } catch (error) {
            console.error('Failed to get plan:', error);
            throw error;
        }
    }

    /**
     * List all plans
     * @param {Object} options - Filter options
     * @returns {Promise<Plan[]>}
     */
    async listPlans(options = {}) {
        try {
            const { includeHidden = false, includeInactive = false, sortBy = 'sortOrder' } = options;

            const command = this.snl.listPlansSNL();
            const response = await this.sender.executeSNL(command, this.aiToken);

            const planIds = this.snl.parsePlansList(response);
            const plans = [];

            for (const planId of planIds) {
                const plan = await this.getPlan(planId);
                if (plan) {
                    plans.push(plan);
                }
            }

            // Filter plans
            const filteredPlans = Plan.filterPlans(plans, includeHidden, includeInactive);

            // Sort plans
            return this.sortPlans(filteredPlans, sortBy);
        } catch (error) {
            console.error('Failed to list plans:', error);
            throw error;
        }
    }

    /**
     * Get active plans for public display
     * @returns {Promise<Plan[]>}
     */
    async getActivePlans() {
        try {
            const plans = await this.listPlans({
                includeHidden: false,
                includeInactive: false
            });

            return plans.filter(plan => plan.isActive && plan.isVisible);
        } catch (error) {
            console.error('Failed to get active plans:', error);
            throw error;
        }
    }

    /**
     * Create default plans for AI
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async createDefaultPlans(aiName) {
        try {
            console.log(`Creating default plans for AI: ${aiName}`);

            const defaultPlans = Plan.getDefaultPlans(aiName);

            for (const plan of defaultPlans) {
                // Check if plan already exists
                const existingPlan = await this.getPlan(plan.id);
                if (!existingPlan) {
                    await this.savePlan(plan);
                    console.log(`✅ Created default plan: ${plan.id}`);
                } else {
                    console.log(`✓ Plan already exists: ${plan.id}`);
                }
            }

            console.log(`✅ Default plans setup completed for AI: ${aiName}`);
        } catch (error) {
            console.error(`Failed to create default plans for AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Update plan pricing
     * @param {string} planId - Plan ID
     * @param {Object} newPricing - New pricing
     * @returns {Promise<Plan>}
     */
    async updatePlanPricing(planId, newPricing) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new NotFoundError(`Plan not found: ${planId}`);
            }

            plan.updatePricing(newPricing);
            return await this.savePlan(plan);
        } catch (error) {
            console.error('Failed to update plan pricing:', error);
            throw error;
        }
    }

    /**
     * Update plan limits
     * @param {string} planId - Plan ID
     * @param {Object} newLimits - New limits
     * @returns {Promise<Plan>}
     */
    async updatePlanLimits(planId, newLimits) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new NotFoundError(`Plan not found: ${planId}`);
            }

            plan.updateLimits(newLimits);
            return await this.savePlan(plan);
        } catch (error) {
            console.error('Failed to update plan limits:', error);
            throw error;
        }
    }

    /**
     * Activate plan
     * @param {string} planId - Plan ID
     * @returns {Promise<Plan>}
     */
    async activatePlan(planId) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new NotFoundError(`Plan not found: ${planId}`);
            }

            plan.activate();
            return await this.savePlan(plan);
        } catch (error) {
            console.error('Failed to activate plan:', error);
            throw error;
        }
    }

    /**
     * Deactivate plan
     * @param {string} planId - Plan ID
     * @returns {Promise<Plan>}
     */
    async deactivatePlan(planId) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new NotFoundError(`Plan not found: ${planId}`);
            }

            plan.deactivate();
            return await this.savePlan(plan);
        } catch (error) {
            console.error('Failed to deactivate plan:', error);
            throw error;
        }
    }

    /**
     * Delete plan
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async deletePlan(planId) {
        try {
            const existingPlan = await this.getPlan(planId);
            if (!existingPlan) {
                throw new NotFoundError(`Plan not found: ${planId}`);
            }

            const command = this.snl.removePlanSNL(planId);
            await this.sender.executeSNL(command, this.aiToken);

            console.log(`✅ Plan deleted: ${planId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete plan:', error);
            throw error;
        }
    }

    /**
     * Sort plans by specified criteria
     * @param {Array<Plan>} plans - Plans to sort
     * @param {string} sortBy - Sort criteria
     * @returns {Array<Plan>} Sorted plans
     */
    sortPlans(plans, sortBy) {
        switch (sortBy) {
            case 'price_monthly_asc':
                return plans.sort((a, b) => Plan.compareByCycle(a, b, 'monthly'));
            case 'price_monthly_desc':
                return plans.sort((a, b) => Plan.compareByCycle(b, a, 'monthly'));
            case 'price_yearly_asc':
                return plans.sort((a, b) => Plan.compareByCycle(a, b, 'yearly'));
            case 'price_yearly_desc':
                return plans.sort((a, b) => Plan.compareByCycle(b, a, 'yearly'));
            case 'name':
                return plans.sort((a, b) => a.name.localeCompare(b.name));
            case 'created':
                return plans.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'updated':
                return plans.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            case 'sortOrder':
            default:
                return plans.sort((a, b) => a.sortOrder - b.sortOrder);
        }
    }

    /**
     * Check if plan exists
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async planExists(planId) {
        try {
            const plan = await this.getPlan(planId);
            return plan !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get plan comparison data
     * @param {Array<string>} planIds - Plan IDs to compare
     * @returns {Promise<Object>} Comparison data
     */
    async comparePlans(planIds) {
        try {
            const plans = [];
            for (const planId of planIds) {
                const plan = await this.getPlan(planId);
                if (plan) {
                    plans.push(plan);
                }
            }

            // Extract all unique features
            const allFeatures = new Set();
            plans.forEach(plan => {
                plan.features.forEach(feature => allFeatures.add(feature));
            });

            // Extract all unique limit types
            const allLimitTypes = new Set();
            plans.forEach(plan => {
                Object.keys(plan.limits).forEach(limitType => allLimitTypes.add(limitType));
            });

            return {
                plans: plans.map(plan => plan.toObject()),
                features: Array.from(allFeatures),
                limitTypes: Array.from(allLimitTypes),
                comparison: this.buildComparisonMatrix(plans, Array.from(allFeatures), Array.from(allLimitTypes))
            };
        } catch (error) {
            console.error('Failed to compare plans:', error);
            throw error;
        }
    }

    /**
     * Build comparison matrix
     * @param {Array<Plan>} plans - Plans to compare
     * @param {Array<string>} features - All features
     * @param {Array<string>} limitTypes - All limit types
     * @returns {Object} Comparison matrix
     */
    buildComparisonMatrix(plans, features, limitTypes) {
        const matrix = {
            features: {},
            limits: {},
            pricing: {}
        };

        // Features matrix
        features.forEach(feature => {
            matrix.features[feature] = {};
            plans.forEach(plan => {
                matrix.features[feature][plan.id] = plan.hasFeature(feature);
            });
        });

        // Limits matrix
        limitTypes.forEach(limitType => {
            matrix.limits[limitType] = {};
            plans.forEach(plan => {
                matrix.limits[limitType][plan.id] = plan.limits[limitType] || 0;
            });
        });

        // Pricing matrix
        plans.forEach(plan => {
            matrix.pricing[plan.id] = {
                monthly: plan.price.monthly,
                yearly: plan.price.yearly,
                yearlySavings: plan.getYearlySavings(),
                trialDays: plan.trialDays,
                setupFee: plan.setupFee
            };
        });

        return matrix;
    }
}

module.exports = PlanManager;