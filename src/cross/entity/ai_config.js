// src/cross/entity/ai_config.js

/**
 * AIConfig - AI configuration entity
 */
class AIConfig {
    constructor(data = {}) {
        this.ai_name = data.ai_name || '';
        this.theme = data.theme || this.getDefaultTheme();
        this.behavior = data.behavior || {};
        this.logo_url = data.logo_url || '';
        this.updated_at = data.updated_at || new Date().toISOString();
        this.updated_by = data.updated_by || '';
    }

    /**
     * Get default theme colors
     * @returns {Object}
     */
    getDefaultTheme() {
        return {
            primary_colors: {
                black: '#000000',
                white: '#FFFFFF',
                dark_blue: '#0363AE',
                dark_purple: '#50038F'
            },
            secondary_colors: {
                purple: '#6332F5',
                turquoise: '#54D3EC',
                blue: '#2F62CD',
                teal: '#3AA3A9'
            },
            gradients: {
                primary: ['#50038F', '#0363AE'], // Dark purple to dark blue
                secondary: ['#6332F5', '#54D3EC'] // Purple to turquoise
            }
        };
    }

    /**
     * Validate AI config
     * @returns {Object}
     */
    validate() {
        const errors = [];

        if (!this.ai_name) {
            errors.push('AI name is required');
        }

        // Validate theme structure
        if (this.theme) {
            if (!this.theme.primary_colors || typeof this.theme.primary_colors !== 'object') {
                errors.push('Primary colors are required in theme');
            }
            if (!this.theme.secondary_colors || typeof this.theme.secondary_colors !== 'object') {
                errors.push('Secondary colors are required in theme');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update theme
     * @param {Object} newTheme - New theme data
     */
    updateTheme(newTheme) {
        this.theme = { ...this.theme, ...newTheme };
        this.updated_at = new Date().toISOString();
    }

    /**
     * Update behavior
     * @param {Object} newBehavior - New behavior data
     */
    updateBehavior(newBehavior) {
        this.behavior = { ...this.behavior, ...newBehavior };
        this.updated_at = new Date().toISOString();
    }

    /**
     * Convert to JSON for storage
     * @returns {Object}
     */
    toJSON() {
        return {
            ai_name: this.ai_name,
            theme: this.theme,
            behavior: this.behavior,
            logo_url: this.logo_url,
            updated_at: this.updated_at,
            updated_by: this.updated_by
        };
    }

    /**
     * Create from NeuronDB data
     * @param {Object} data - Data from NeuronDB
     * @returns {AIConfig}
     */
    static fromNeuronDB(data) {
        return new AIConfig(data);
    }
}

module.exports = AIConfig;