// src/cross/entity/root_command.js

const Command = require('./command');

/**
 * Root Command - Entry point for command workflows
 */
class RootCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'root' });
        this.parameters = data.parameters || [];
        this.bags = data.bags || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            parameters: this.parameters,
            bags: this.bags
        };
    }

    validate() {
        const errors = super.validate();

        if (!Array.isArray(this.parameters)) {
            errors.push('Parameters must be an array');
        }

        if (!Array.isArray(this.bags)) {
            errors.push('Bags must be an array');
        }

        return errors;
    }
}

module.exports = RootCommand;

