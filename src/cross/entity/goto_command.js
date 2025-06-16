// src/cross/entity/goto_command.js

const Command = require('./command');

/**
 * GoTo Command - Jump to another step
 */
class GoToCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'goto' });
        this.targetStep = data.targetStep || '';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            targetStep: this.targetStep
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.targetStep.trim()) {
            errors.push('Target step is required');
        }

        return errors;
    }
}

module.exports = GoToCommand;