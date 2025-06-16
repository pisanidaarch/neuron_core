// src/cross/entity/ai_command.js

const Command = require('./command');

/**
 * AI Command - AI processing commands
 */
class AICommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'ai' });
        this.promptTemplate = data.promptTemplate || '';
        this.model = data.model || null;
        this.outputBag = data.outputBag || 'latest';
        this.behavior = data.behavior || null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            promptTemplate: this.promptTemplate,
            model: this.model,
            outputBag: this.outputBag,
            behavior: this.behavior
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.promptTemplate.trim()) {
            errors.push('Prompt template is required');
        }

        if (!this.outputBag.trim()) {
            errors.push('Output bag name is required');
        }

        return errors;
    }
}

module.exports = AICommand;