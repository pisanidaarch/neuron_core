// src/cross/entity/if_command.js

const Command = require('./command');

/**
 * If Command - Conditional logic
 */
class IfCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'if' });
        this.conditions = data.conditions || [];
        this.logicType = data.logicType || 'and'; // 'and' or 'or'
        this.truePath = data.truePath || [];
        this.falsePath = data.falsePath || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            conditions: this.conditions,
            logicType: this.logicType,
            truePath: this.truePath,
            falsePath: this.falsePath
        };
    }

    validate() {
        const errors = super.validate();

        if (!Array.isArray(this.conditions) || this.conditions.length === 0) {
            errors.push('At least one condition is required');
        }

        if (!['and', 'or'].includes(this.logicType)) {
            errors.push('Logic type must be "and" or "or"');
        }

        // Validate conditions
        this.conditions.forEach((condition, index) => {
            if (!condition.bagName) {
                errors.push(`Condition ${index}: bag name is required`);
            }
            if (condition.value === undefined || condition.value === null) {
                errors.push(`Condition ${index}: value is required`);
            }
        });

        return errors;
    }
}

module.exports = IfCommand;