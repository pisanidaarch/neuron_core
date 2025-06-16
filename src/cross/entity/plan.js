// src/cross/entity/plan.js

/**
 * Plan Entity - Represents a subscription plan
 */
class Plan {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.price = data.price || { monthly: 0, yearly: 0 };
        this.currency = data.currency || 'BRL';
        this.features = data.features || [];
        this.limits = data.limits || {};
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
        this.sortOrder = data.sortOrder || 0;
        this.metadata = data.metadata || {};
        this.trialDays = data.trialDays || 0;
        this.setupFee = data.setupFee || 0;
        this.aiName = data.aiName || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate the plan entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.id || this.id.trim().length === 0) {
            errors.push('Plan ID is required');
        }

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Plan name is required');
        }

        if (this.name && this.name.length > 100) {
            errors.push('Plan name must be 100 characters or less');
        }

        if (!this.price || typeof this.price !== 'object') {
            errors.push('Plan price is required and must be an object');
        } else {
            if (typeof this.price.monthly !== 'number' || this.price.monthly < 0) {
                errors.push('Monthly price must be a non-negative number');
            }
            if (typeof this.price.yearly !== 'number' || this.price.yearly < 0) {
                errors.push('Yearly price must be a non-negative number');
            }
        }

        if (!Array.isArray(this.features)) {
            errors.push('Features must be an array');
        }

        if (!this.limits || typeof this.limits !== 'object') {
            errors.push('Limits must be an object');
        }

        if (this.trialDays && (typeof this.trialDays !== 'number' || this.trialDays < 0)) {
            errors.push('Trial days must be a non-negative number');
        }

        if (this.setupFee && (typeof this.setupFee !== 'number' || this.setupFee < 0)) {
            errors.push('Setup fee must be a non-negative number');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            price: this.price,
            currency: this.currency,
            features: this.features,
            limits: this.limits,
            isActive: this.isActive,
            isVisible: this.isVisible,
            sortOrder: this.sortOrder,
            metadata: this.metadata,
            trialDays: this.trialDays,
            setupFee: this.setupFee,
            aiName: this.aiName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {Plan}
     */
    static fromObject(data) {
        return new Plan(data);
    }

    /**
     * Calculate yearly savings percentage
     * @returns {number} Savings percentage
     */
    getYearlySavings() {
        if (!this.price.monthly || !this.price.yearly) return 0;

        const yearlyEquivalent = this.price.monthly * 12;
        if (yearlyEquivalent === 0) return 0;

        return Math.round(((yearlyEquivalent - this.price.yearly) / yearlyEquivalent) * 100);
    }

    /**
     * Get formatted price for display
     * @param {string} cycle - Billing cycle (monthly|yearly)
     * @param {string} locale - Locale for formatting
     * @returns {string} Formatted price
     */
    getFormattedPrice(cycle = 'monthly', locale = 'pt-BR') {
        const price = cycle === 'yearly' ? this.price.yearly : this.price.monthly;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.currency
        }).format(price);
    }

    /**
     * Check if plan has specific feature
     * @param {string} feature - Feature to check
     * @returns {boolean}
     */
    hasFeature(feature) {
        return this.features.includes(feature);
    }

    /**
     * Add feature to plan
     * @param {string} feature - Feature to add
     */
    addFeature(feature) {
        if (!this.hasFeature(feature)) {
            this.features.push(feature);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove feature from plan
     * @param {string} feature - Feature to remove
     */
    removeFeature(feature) {
        const index = this.features.indexOf(feature);
        if (index > -1) {
            this.features.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Update plan pricing
     * @param {Object} newPricing - New pricing object
     */
    updatePricing(newPricing) {
        this.price = { ...this.price, ...newPricing };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update plan limits
     * @param {Object} newLimits - New limits object
     */
    updateLimits(newLimits) {
        this.limits = { ...this.limits, ...newLimits };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Activate plan
     */
    activate() {
        this.isActive = true;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Deactivate plan
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Show plan in public listings
     */
    show() {
        this.isVisible = true;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Hide plan from public listings
     */
    hide() {
        this.isVisible = false;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get default plans for an AI
     * @param {string} aiName - AI name
     * @returns {Array<Plan>} Default plans
     */
    static getDefaultPlans(aiName) {
        return [
            new Plan({
                id: 'basic',
                name: 'Plano Básico',
                description: 'Ideal para uso pessoal e pequenos projetos',
                price: {
                    monthly: 29.90,
                    yearly: 299.00
                },
                features: [
                    'Até 1.000 comandos/mês',
                    '5 workflows ativos',
                    'Suporte por email',
                    '1 usuário',
                    '1GB de armazenamento'
                ],
                limits: {
                    commands: 1000,
                    workflows: 5,
                    users: 1,
                    storage: 1,
                    requests: 10000
                },
                trialDays: 7,
                sortOrder: 1,
                aiName: aiName
            }),
            new Plan({
                id: 'professional',
                name: 'Plano Profissional',
                description: 'Para equipes e projetos de médio porte',
                price: {
                    monthly: 99.90,
                    yearly: 999.00
                },
                features: [
                    'Até 10.000 comandos/mês',
                    '50 workflows ativos',
                    'Suporte prioritário',
                    'Até 10 usuários',
                    '10GB de armazenamento',
                    'Personalização de cores',
                    'Integrações avançadas'
                ],
                limits: {
                    commands: 10000,
                    workflows: 50,
                    users: 10,
                    storage: 10,
                    requests: 100000
                },
                trialDays: 14,
                sortOrder: 2,
                aiName: aiName
            }),
            new Plan({
                id: 'enterprise',
                name: 'Plano Enterprise',
                description: 'Para grandes empresas e projetos complexos',
                price: {
                    monthly: 299.90,
                    yearly: 2999.00
                },
                features: [
                    'Comandos ilimitados',
                    'Workflows ilimitados',
                    'Suporte 24/7',
                    'Usuários ilimitados',
                    '100GB de armazenamento',
                    'Personalização completa',
                    'Integração com APIs externas',
                    'SLA garantido',
                    'Suporte dedicado'
                ],
                limits: {
                    commands: -1, // Unlimited
                    workflows: -1, // Unlimited
                    users: -1, // Unlimited
                    storage: 100,
                    requests: -1 // Unlimited
                },
                trialDays: 30,
                sortOrder: 3,
                aiName: aiName
            })
        ];
    }

    /**
     * Create a custom plan
     * @param {string} id - Plan ID
     * @param {string} name - Plan name
     * @param {string} aiName - AI name
     * @param {Object} options - Plan options
     * @returns {Plan}
     */
    static createCustom(id, name, aiName, options = {}) {
        return new Plan({
            id,
            name,
            aiName,
            description: options.description || '',
            price: options.price || { monthly: 0, yearly: 0 },
            features: options.features || [],
            limits: options.limits || {},
            trialDays: options.trialDays || 0,
            setupFee: options.setupFee || 0,
            metadata: options.metadata || {}
        });
    }

    /**
     * Compare two plans by price
     * @param {Plan} planA - First plan
     * @param {Plan} planB - Second plan
     * @param {string} cycle - Billing cycle to compare
     * @returns {number} Comparison result
     */
    static compareByCycle(planA, planB, cycle = 'monthly') {
        const priceA = cycle === 'yearly' ? planA.price.yearly : planA.price.monthly;
        const priceB = cycle === 'yearly' ? planB.price.yearly : planB.price.monthly;

        return priceA - priceB;
    }

    /**
     * Filter plans by visibility and status
     * @param {Array<Plan>} plans - Plans to filter
     * @param {boolean} includeHidden - Include hidden plans
     * @param {boolean} includeInactive - Include inactive plans
     * @returns {Array<Plan>} Filtered plans
     */
    static filterPlans(plans, includeHidden = false, includeInactive = false) {
        return plans.filter(plan => {
            if (!includeHidden && !plan.isVisible) return false;
            if (!includeInactive && !plan.isActive) return false;
            return true;
        });
    }
}

module.exports = Plan;