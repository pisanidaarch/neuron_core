// src/cross/entity/script_command.js

const Command = require('./command');

/**
 * Script Command - JavaScript execution
 */
class ScriptCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'script' });
        this.code = data.code || '';
        this.outputBag = data.outputBag || 'latest';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            code: this.code,
            outputBag: this.outputBag
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.code.trim()) {
            errors.push('Script code is required');
        }

        if (!this.outputBag.trim()) {
            errors.push('Output bag name is required');
        }

        return errors;
    }
}

module.exports = ScriptCommand;

