// src/cross/entity/config.js

const fs = require('fs');
const path = require('path');

/**
 * Configuration loader for NeuronCore
 */
class Config {
    constructor() {
        this._config = null;
        this._loaded = false;
    }

    /**
     * Load configuration from config.json
     * @returns {Object} Configuration object
     */
    load() {
        if (this._loaded) {
            return this._config;
        }

        try {
            // Try to load from project root
            const configPath = path.join(process.cwd(), 'config.json');

            if (!fs.existsSync(configPath)) {
                // If not found, try config.json.example
                const examplePath = path.join(process.cwd(), 'config.json.example');
                if (fs.existsSync(examplePath)) {
                    console.warn('config.json not found, using config.json.example');
                    console.warn('Please create a config.json file with your actual tokens');
                    const configData = fs.readFileSync(examplePath, 'utf8');
                    this._config = JSON.parse(configData);
                } else {
                    throw new Error('Neither config.json nor config.json.example found');
                }
            } else {
                const configData = fs.readFileSync(configPath, 'utf8');
                this._config = JSON.parse(configData);
            }

            this._loaded = true;
            this._validateConfig();

            return this._config;

        } catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }

    /**
     * Validate required configuration fields
     */
    _validateConfig() {
        const required = [
            'neuronDB.url',
            'neuronDB.configToken',
            'server.port'
        ];

        for (const field of required) {
            const value = this._getNestedValue(this._config, field);
            if (!value) {
                throw new Error(`Missing required configuration field: ${field}`);
            }
        }
    }

    /**
     * Get nested value from object
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * Get configuration value
     * @param {string} path - Dot notation path (e.g., 'neuronDB.url')
     * @returns {*} Configuration value
     */
    get(path) {
        if (!this._loaded) {
            this.load();
        }

        return this._getNestedValue(this._config, path);
    }

    /**
     * Get entire configuration object
     * @returns {Object}
     */
    getAll() {
        if (!this._loaded) {
            this.load();
        }

        return this._config;
    }

    /**
     * Reload configuration from file
     */
    reload() {
        this._loaded = false;
        return this.load();
    }
}

// Export singleton instance
module.exports = new Config();