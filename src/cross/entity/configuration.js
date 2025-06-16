// src/cross/entity/configuration.js

/**
 * Configuration Entity - Represents application configuration settings
 */
class Configuration {
    constructor(data = {}) {
        this.id = data.id || 'app_config';
        this.aiName = data.aiName || '';

        // Color scheme
        this.colors = {
            primary: data.colors?.primary || this.getDefaultColors().primary,
            secondary: data.colors?.secondary || this.getDefaultColors().secondary,
            gradients: data.colors?.gradients || this.getDefaultColors().gradients
        };

        // Logo configuration
        this.logo = {
            url: data.logo?.url || '',
            width: data.logo?.width || 200,
            height: data.logo?.height || 60,
            alt: data.logo?.alt || 'AI Logo'
        };

        // Behavior configuration (overrides default AI behavior)
        this.behavior = data.behavior || null;

        // UI configuration
        this.ui = {
            theme: data.ui?.theme || 'dark',
            language: data.ui?.language || 'pt-BR',
            timezone: data.ui?.timezone || 'America/Sao_Paulo',
            dateFormat: data.ui?.dateFormat || 'DD/MM/YYYY',
            timeFormat: data.ui?.timeFormat || 'HH:mm'
        };

        // Feature flags
        this.features = {
            multiAI: data.features?.multiAI !== undefined ? data.features.multiAI : true,
            workflows: data.features?.workflows !== undefined ? data.features.workflows : true,
            colorCustomization: data.features?.colorCustomization !== undefined ? data.features.colorCustomization : true,
            behaviorCustomization: data.features?.behaviorCustomization !== undefined ? data.features.behaviorCustomization : true,
            userManagement: data.features?.userManagement !== undefined ? data.features.userManagement : true
        };

        // Limits and quotas
        this.limits = {
            maxUsers: data.limits?.maxUsers || 100,
            maxWorkflows: data.limits?.maxWorkflows || 1000,
            maxCommands: data.limits?.maxCommands || 5000,
            dailyRequests: data.limits?.dailyRequests || 10000,
            storageGB: data.limits?.storageGB || 10
        };

        // Integration settings
        this.integrations = {
            calendar: data.integrations?.calendar || false,
            email: data.integrations?.email || false,
            slack: data.integrations?.slack || false,
            webhook: data.integrations?.webhook || false
        };

        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.updatedBy = data.updatedBy || '';
    }

    /**
     * Get default Arch colors
     * @returns {Object}
     */
    getDefaultColors() {
        return {
            primary: {
                preto: '#000000',
                branco: '#FFFFFF',
                azulEscuro: '#0363AE',
                roxoEscuro: '#50038F'
            },
            secondary: {
                roxo: '#6332F5',
                azulTurquesa: '#54D3EC',
                azul: '#2F62CD',
                azulPetroleo: '#3AA3A9'
            },
            gradients: {
                roxoAzulEscuro: 'linear-gradient(45deg, #50038F, #0363AE)',
                roxoAzulTurquesa: 'linear-gradient(45deg, #6332F5, #54D3EC)'
            }
        };
    }

    /**
     * Validate the configuration entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.aiName || this.aiName.trim().length === 0) {
            errors.push('AI name is required');
        }

        // Validate colors
        if (!this.colors || typeof this.colors !== 'object') {
            errors.push('Colors configuration is required');
        } else {
            // Validate primary colors
            if (!this.colors.primary || typeof this.colors.primary !== 'object') {
                errors.push('Primary colors are required');
            }

            // Validate secondary colors
            if (!this.colors.secondary || typeof this.colors.secondary !== 'object') {
                errors.push('Secondary colors are required');
            }

            // Validate gradients
            if (!this.colors.gradients || typeof this.colors.gradients !== 'object') {
                errors.push('Gradient colors are required');
            }
        }

        // Validate UI settings
        if (this.ui.theme && !['light', 'dark', 'auto'].includes(this.ui.theme)) {
            errors.push('Invalid theme. Must be light, dark, or auto');
        }

        // Validate limits
        if (this.limits.maxUsers && (typeof this.limits.maxUsers !== 'number' || this.limits.maxUsers < 1)) {
            errors.push('Max users must be a positive number');
        }

        if (this.limits.dailyRequests && (typeof this.limits.dailyRequests !== 'number' || this.limits.dailyRequests < 1)) {
            errors.push('Daily requests limit must be a positive number');
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
            aiName: this.aiName,
            colors: this.colors,
            logo: this.logo,
            behavior: this.behavior,
            ui: this.ui,
            features: this.features,
            limits: this.limits,
            integrations: this.integrations,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            updatedBy: this.updatedBy
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {Configuration}
     */
    static fromObject(data) {
        return new Configuration(data);
    }

    /**
     * Update colors
     * @param {Object} newColors - New color configuration
     */
    updateColors(newColors) {
        if (newColors.primary) {
            this.colors.primary = { ...this.colors.primary, ...newColors.primary };
        }
        if (newColors.secondary) {
            this.colors.secondary = { ...this.colors.secondary, ...newColors.secondary };
        }
        if (newColors.gradients) {
            this.colors.gradients = { ...this.colors.gradients, ...newColors.gradients };
        }
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update logo
     * @param {Object} logoData - Logo configuration
     */
    updateLogo(logoData) {
        this.logo = { ...this.logo, ...logoData };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update behavior
     * @param {string} behavior - New behavior text
     */
    updateBehavior(behavior) {
        this.behavior = behavior;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update UI settings
     * @param {Object} uiSettings - UI configuration
     */
    updateUI(uiSettings) {
        this.ui = { ...this.ui, ...uiSettings };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update feature flags
     * @param {Object} features - Feature flags
     */
    updateFeatures(features) {
        this.features = { ...this.features, ...features };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update limits
     * @param {Object} limits - New limits
     */
    updateLimits(limits) {
        this.limits = { ...this.limits, ...limits };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update integrations
     * @param {Object} integrations - Integration settings
     */
    updateIntegrations(integrations) {
        this.integrations = { ...this.integrations, ...integrations };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Check if color customization is enabled for user
     * @param {Object} user - User object
     * @returns {boolean}
     */
    canCustomizeColors(user) {
        if (!this.features.colorCustomization) {
            return false;
        }

        // Only admin users can customize colors
        return user.groups?.includes('admin') || user.permissions?.some(p =>
            p.permission === 'config.customize'
        );
    }

    /**
     * Check if behavior customization is enabled for user
     * @param {Object} user - User object
     * @returns {boolean}
     */
    canCustomizeBehavior(user) {
        if (!this.features.behaviorCustomization) {
            return false;
        }

        // Only admin users can customize behavior
        return user.groups?.includes('admin') || user.permissions?.some(p =>
            p.permission === 'config.behavior'
        );
    }

    /**
     * Get CSS variables for colors
     * @returns {Object}
     */
    getCSSVariables() {
        const variables = {};

        // Primary colors
        Object.entries(this.colors.primary).forEach(([key, value]) => {
            variables[`--color-primary-${key.toLowerCase()}`] = value;
        });

        // Secondary colors
        Object.entries(this.colors.secondary).forEach(([key, value]) => {
            variables[`--color-secondary-${key.toLowerCase()}`] = value;
        });

        // Gradients
        Object.entries(this.colors.gradients).forEach(([key, value]) => {
            variables[`--gradient-${key.toLowerCase()}`] = value;
        });

        return variables;
    }

    /**
     * Create default configuration for AI
     * @param {string} aiName - AI name
     * @returns {Configuration}
     */
    static createDefault(aiName) {
        return new Configuration({
            aiName: aiName,
            id: `config_${aiName}`
        });
    }

    /**
     * Validate color hex format
     * @param {string} color - Color hex string
     * @returns {boolean}
     */
    static isValidHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    /**
     * Validate gradient CSS format
     * @param {string} gradient - CSS gradient string
     * @returns {boolean}
     */
    static isValidGradient(gradient) {
        return gradient.startsWith('linear-gradient(') ||
               gradient.startsWith('radial-gradient(') ||
               gradient.startsWith('conic-gradient(');
    }
}

module.exports = Configuration;