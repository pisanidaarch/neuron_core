// src/cross/entity/frontend_command.js

const Command = require('./command');

/**
 * Frontend Command - UI interaction commands
 */
class FrontendCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'frontend' });
        this.title = data.title || '';
        this.fields = data.fields || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            title: this.title,
            fields: this.fields
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.title.trim()) {
            errors.push('Frontend title is required');
        }

        if (!Array.isArray(this.fields)) {
            errors.push('Fields must be an array');
        }

        // Validate fields
        this.fields.forEach((field, index) => {
            if (!field.name) {
                errors.push(`Field ${index}: name is required`);
            }
            if (!field.type) {
                errors.push(`Field ${index}: type is required`);
            }
            if (!field.bagName) {
                errors.push(`Field ${index}: bagName is required`);
            }
        });

        return errors;
    }
}

module.exports = FrontendCommand;