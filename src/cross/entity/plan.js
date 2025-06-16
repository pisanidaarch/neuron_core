// src/cross/entity/plan.js

/**
 * Plan entity for NeuronCore security module
 */
class Plan {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.price = data.price || 0;
        this.currency = data.currency || 'BRL';
        this.billing_cycle = data.billing_cycle || 'monthly'; // monthly, yearly
        this.limits = data.limits || {
            max_users: 1,
            max_tokens: 100000,
            max_commands: 1000,
            max_workflows: 100
        };
        this.features = data.features || [];
        this.active = data.active !== undefined ? data.active : true;
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    /**
     * Create plan from NeuronDB response
     * @param {string} planId - Plan ID (key)
     * @param {Object} data - Plan data from NeuronDB
     * @returns {Plan}
     */
    static fromNeuronDB(planId, data) {
        return new Plan({
            id: planId,
            name: data.name,
            description: data.description,
            price: data.price,
            currency: data.currency || 'BRL',
            billing_cycle: data.billing_cycle || 'monthly',
            limits: data.limits || {
                max_users: 1,
                max_tokens: 100000,
                max_commands: 1000,
                max_workflows: 100
            },
            features: data.features || [],
            active: data.active !== undefined ? data.active : true,
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
            name: this.name,
            description: this.description,
            price: this.price,
            currency: this.currency,
            billing_cycle: this.billing_cycle,
            limits: this.limits,
            features: this.features,
            active: this.active,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Validate plan data
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.id || this.id.length < 2) {
            errors.push('Plan ID must be at least 2 characters');
        }

        if (!this.name || this.name.length < 2) {
            errors.push('Plan name must be at least 2 characters');
        }

        if (this.price < 0) {
            errors.push('Price cannot be negative');
        }

        if (!['monthly', 'yearly'].includes(this.billing_cycle)) {
            errors.push('Billing cycle must be monthly or yearly');
        }

        if (!this.limits.max_users || this.limits.max_users < 1) {
            errors.push('Max users must be at least 1');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if plan allows specific user count
     * @param {number} userCount - Number of users
     * @returns {boolean}
     */
    allowsUserCount(userCount) {
        return userCount <= this.limits.max_users;
    }

    /**
     * Check if plan allows specific token usage
     * @param {number} tokens - Number of tokens
     * @returns {boolean}
     */
    allowsTokens(tokens) {
        return tokens <= this.limits.max_tokens;
    }

    /**
     * Check if plan allows specific command count
     * @param {number} commands - Number of commands
     * @returns {boolean}
     */
    allowsCommands(commands) {
        return commands <= this.limits.max_commands;
    }

    /**
     * Check if plan allows specific workflow count
     * @param {number} workflows - Number of workflows
     * @returns {boolean}
     */
    allowsWorkflows(workflows) {
        return workflows <= this.limits.max_workflows;
    }

    /**
     * Get monthly price (convert yearly to monthly if needed)
     * @returns {number}
     */
    getMonthlyPrice() {
        if (this.billing_cycle === 'monthly') {
            return this.price;
        }
        return this.price / 12;
    }

    /**
     * Get yearly price (convert monthly to yearly if needed)
     * @returns {number}
     */
    getYearlyPrice() {
        if (this.billing_cycle === 'yearly') {
            return this.price;
        }
        return this.price * 12;
    }

    /**
     * Deactivate plan
     */
    deactivate() {
        this.active = false;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Activate plan
     */
    activate() {
        this.active = true;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Update limits
     * @param {Object} newLimits - New limits object
     */
    updateLimits(newLimits) {
        this.limits = { ...this.limits, ...newLimits };
        this.updated_at = new Date().toISOString();
    }

    /**
     * Add feature
     * @param {string} feature - Feature name
     */
    addFeature(feature) {
        if (!this.features.includes(feature)) {
            this.features.push(feature);
            this.updated_at = new Date().toISOString();
        }
    }

    /**
     * Remove feature
     * @param {string} feature - Feature name
     */
    removeFeature(feature) {
        const index = this.features.indexOf(feature);
        if (index > -1) {
            this.features.splice(index, 1);
            this.updated_at = new Date().toISOString();
        }
    }

    /**
     * Check if plan has feature
     * @param {string} feature - Feature name
     * @returns {boolean}
     */
    hasFeature(feature) {
        return this.features.includes(feature);
    }

    /**
     * Create default plans
     * @returns {Plan[]}
     */
    static createDefaultPlans() {
        return [
            new Plan({
                id: 'basic',
                name: 'Basic Plan',
                description: 'Basic plan for individual users',
                price: 29.90,
                currency: 'BRL',
                billing_cycle: 'monthly',
                limits: {
                    max_users: 1,
                    max_tokens: 100000,
                    max_commands: 1000,
                    max_workflows: 100
                },
                features: ['basic_ai_access', 'email_support']
            }),
            new Plan({
                id: 'professional',
                name: 'Professional Plan',
                description: 'Professional plan for small teams',
                price: 89.90,
                currency: 'BRL',
                billing_cycle: 'monthly',
                limits: {
                    max_users: 5,
                    max_tokens: 500000,
                    max_commands: 5000,
                    max_workflows: 500
                },
                features: ['full_ai_access', 'priority_support', 'custom_workflows']
            }),
            new Plan({
                id: 'enterprise',
                name: 'Enterprise Plan',
                description: 'Enterprise plan for large organizations',
                price: 299.90,
                currency: 'BRL',
                billing_cycle: 'monthly',
                limits: {
                    max_users: 25,
                    max_tokens: 2000000,
                    max_commands: 20000,
                    max_workflows: 2000
                },
                features: ['full_ai_access', '24h_support', 'custom_workflows', 'api_access', 'advanced_analytics']
            })
        ];
    }
}

module.exports = Plan;