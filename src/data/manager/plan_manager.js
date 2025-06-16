// src/data/manager/plan_manager.js

const Plan = require('../../cross/entity/plan');
const PlanSNL = require('../snl/plan_snl');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * PlanManager - Manages Plan entity operations
 */
class PlanManager {
    constructor(aiKey) {
        this.aiKey = aiKey;
        this.planSNL = new PlanSNL();
        this.sender = new NeuronDBSender();
    }

    /**
     * Initialize plans structure if needed
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const checkCommand = this.planSNL.checkPlansStructureExistsSNL();
            const checkResponse = await this.sender.executeSNL(checkCommand, this.aiKey);

            const exists = this.planSNL.parseStructureExistsResponse(checkResponse);
            if (!exists) {
                const createCommand = this.planSNL.createPlansStructureSNL();
                await this.sender.executeSNL(createCommand, this.aiKey);
            }

            // Create default plans if none exist
            await this.createDefaultPlans();
        } catch (error) {
            console.error('Failed to initialize plans structure:', error);
            throw error;
        }
    }

    /**
     * Create default plans if none exist
     * @returns {Promise<void>}
     */
    async createDefaultPlans() {
        try {
            const existingPlans = await this.getAllPlans();
            if (existingPlans.length === 0) {
                const defaultPlans = Plan.createDefaultPlans();
                for (const plan of defaultPlans) {
                    await this.savePlan(plan);
                }
            }
        } catch (error) {
            console.error('Failed to create default plans:', error);
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
                throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
            }

            const planData = this.planSNL.buildPlanData(plan);
            const command = this.planSNL.setPlanSNL(plan.id, planData);
            await this.sender.executeSNL(command, this.aiKey);

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
            const command = this.planSNL.getPlanSNL(planId);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const planData = this.planSNL.parsePlanResponse(response);
            if (!planData) {
                return null;
            }

            return Plan.fromNeuronDB(planId, planData);
        } catch (error) {
            console.error('Failed to get plan:', error);
            return null;
        }
    }

    /**
     * Get all plans
     * @returns {Promise<Plan[]>}
     */
    async getAllPlans() {
        try {
            const command = this.planSNL.getAllPlansSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            const plansData = this.planSNL.parseAllPlansResponse(response);
            const plans = [];

            for (const [planId, planData] of Object.entries(plansData)) {
                const plan = Plan.fromNeuronDB(planId, planData);
                plans.push(plan);
            }

            return plans;
        } catch (error) {
            console.error('Failed to get all plans:', error);
            return [];
        }
    }

    /**
     * Get active plans only
     * @returns {Promise<Plan[]>}
     */
    async getActivePlans() {
        try {
            const allPlans = await this.getAllPlans();
            return allPlans.filter(plan => plan.active);
        } catch (error) {
            console.error('Failed to get active plans:', error);
            return [];
        }
    }

    /**
     * Get plans by billing cycle
     * @param {string} billingCycle - Billing cycle (monthly, yearly)
     * @returns {Promise<Plan[]>}
     */
    async getPlansByBillingCycle(billingCycle) {
        try {
            const allPlans = await this.getAllPlans();
            return allPlans.filter(plan => plan.billing_cycle === billingCycle);
        } catch (error) {
            console.error('Failed to get plans by billing cycle:', error);
            return [];
        }
    }

    /**
     * Get list of plan IDs
     * @returns {Promise<string[]>}
     */
    async getPlanList() {
        try {
            const command = this.planSNL.getListPlansSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.planSNL.parsePlansListResponse(response);
        } catch (error) {
            console.error('Failed to get plan list:', error);
            return [];
        }
    }

    /**
     * Search plans
     * @param {string} searchTerm - Search term
     * @returns {Promise<Plan[]>}
     */
    async searchPlans(searchTerm) {
        try {
            const command = this.planSNL.searchPlansSNL(searchTerm);
            const response = await this.sender.executeSNL(command, this.aiKey);

            const searchResults = this.planSNL.parseSearchResponse(response);
            const plans = [];

            for (const planData of searchResults) {
                const plan = Plan.fromNeuronDB(planData.id, planData);
                plans.push(plan);
            }

            return plans;
        } catch (error) {
            console.error('Failed to search plans:', error);
            return [];
        }
    }

    /**
     * Remove plan
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async removePlan(planId) {
        try {
            const command = this.planSNL.removePlanSNL(planId);
            await this.sender.executeSNL(command, this.aiKey);
            return true;
        } catch (error) {
            console.error('Failed to remove plan:', error);
            return false;
        }
    }

    /**
     * Check if plan exists
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async planExists(planId) {
        const plan = await this.getPlan(planId);
        return plan !== null;
    }

    /**
     * Create plan
     * @param {string} planId - Plan ID
     * @param {string} name - Plan name
     * @param {string} description - Plan description
     * @param {number} price - Plan price
     * @param {Object} limits - Plan limits
     * @param {string[]} features - Plan features
     * @returns {Promise<Plan>}
     */
    async createPlan(planId, name, description, price, limits = {}, features = []) {
        try {
            const plan = new Plan({
                id: planId,
                name,
                description,
                price,
                limits: {
                    max_users: 1,
                    max_tokens: 100000,
                    max_commands: 1000,
                    max_workflows: 100,
                    ...limits
                },
                features
            });

            return await this.savePlan(plan);
        } catch (error) {
            console.error('Failed to create plan:', error);
            throw error;
        }
    }

    /**
     * Activate plan
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async activatePlan(planId) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.activate();
            await this.savePlan(plan);
            return true;
        } catch (error) {
            console.error('Failed to activate plan:', error);
            return false;
        }
    }

    /**
     * Deactivate plan
     * @param {string} planId - Plan ID
     * @returns {Promise<boolean>}
     */
    async deactivatePlan(planId) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.deactivate();
            await this.savePlan(plan);
            return true;
        } catch (error) {
            console.error('Failed to deactivate plan:', error);
            return false;
        }
    }

    /**
     * Update plan limits
     * @param {string} planId - Plan ID
     * @param {Object} newLimits - New limits
     * @returns {Promise<boolean>}
     */
    async updatePlanLimits(planId, newLimits) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.updateLimits(newLimits);
            await this.savePlan(plan);
            return true;
        } catch (error) {
            console.error('Failed to update plan limits:', error);
            return false;
        }
    }

    /**
     * Add feature to plan
     * @param {string} planId - Plan ID
     * @param {string} feature - Feature name
     * @returns {Promise<boolean>}
     */
    async addFeatureToPlan(planId, feature) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.addFeature(feature);
            await this.savePlan(plan);
            return true;
        } catch (error) {
            console.error('Failed to add feature to plan:', error);
            return false;
        }
    }

    /**
     * Remove feature from plan
     * @param {string} planId - Plan ID
     * @param {string} feature - Feature name
     * @returns {Promise<boolean>}
     */
    async removeFeatureFromPlan(planId, feature) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            plan.removeFeature(feature);
            await this.savePlan(plan);
            return true;
        } catch (error) {
            console.error('Failed to remove feature from plan:', error);
            return false;
        }
    }

    /**
     * Get plan pricing information
     * @returns {Promise<Array>}
     */
    async getPlanPricing() {
        try {
            const command = this.planSNL.getPlanPricingSNL();
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.planSNL.parsePlanPricing(response);
        } catch (error) {
            console.error('Failed to get plan pricing:', error);
            return [];
        }
    }

    /**
     * Get plan limits
     * @param {string} planId - Plan ID
     * @returns {Promise<Object|null>}
     */
    async getPlanLimits(planId) {
        try {
            const command = this.planSNL.getPlanLimitsSNL(planId);
            const response = await this.sender.executeSNL(command, this.aiKey);

            return this.planSNL.parsePlanLimits(response);
        } catch (error) {
            console.error('Failed to get plan limits:', error);
            return null;
        }
    }

    /**
     * Check if plan allows specific user count
     * @param {string} planId - Plan ID
     * @param {number} userCount - User count to check
     * @returns {Promise<boolean>}
     */
    async planAllowsUserCount(planId, userCount) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                return false;
            }

            return plan.allowsUserCount(userCount);
        } catch (error) {
            console.error('Failed to check plan user count:', error);
            return false;
        }
    }

    /**
     * Check if plan allows specific token usage
     * @param {string} planId - Plan ID
     * @param {number} tokens - Token count to check
     * @returns {Promise<boolean>}
     */
    async planAllowsTokens(planId, tokens) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                return false;
            }

            return plan.allowsTokens(tokens);
        } catch (error) {
            console.error('Failed to check plan token usage:', error);
            return false;
        }
    }

    /**
     * Check if plan has feature
     * @param {string} planId - Plan ID
     * @param {string} feature - Feature to check
     * @returns {Promise<boolean>}
     */
    async planHasFeature(planId, feature) {
        try {
            const plan = await this.getPlan(planId);
            if (!plan) {
                return false;
            }

            return plan.hasFeature(feature);
        } catch (error) {
            console.error('Failed to check plan feature:', error);
            return false;
        }
    }
}

module.exports = PlanManager;