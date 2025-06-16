// src/cross/entity/alert_command.js

const Command = require('./command');

/**
 * Alert Command - Send notifications
 */
class AlertCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'alert' });
        this.who = data.who || 'self'; // 'self', 'group', 'user'
        this.target = data.target || ''; // group name or user email
        this.message = data.message || '';
        this.options = data.options || ['ok']; // ['ok', 'late', 'cancel']
    }

    toJSON() {
        return {
            ...super.toJSON(),
            who: this.who,
            target: this.target,
            message: this.message,
            options: this.options
        };
    }

    validate() {
        const errors = super.validate();

        if (!['self', 'group', 'user'].includes(this.who)) {
            errors.push('Who must be one of: self, group, user');
        }

        if (this.who !== 'self' && !this.target.trim()) {
            errors.push('Target is required when who is not self');
        }

        if (!this.message.trim()) {
            errors.push('Message is required');
        }

        if (!Array.isArray(this.options) || this.options.length === 0) {
            errors.push('At least one option is required');
        }

        const validOptions = ['ok', 'late', 'cancel'];
        const invalidOptions = this.options.filter(opt => !validOptions.includes(opt));
        if (invalidOptions.length > 0) {
            errors.push(`Invalid options: ${invalidOptions.join(', ')}`);
        }

        return errors;
    }
}

module.exports = AlertCommand;