// src/cross/entity/timer_command.js

const Command = require('./command');

/**
 * Timer Command - Delay execution
 */
class TimerCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'timer' });
        this.duration = data.duration || 0;
        this.unit = data.unit || 'seconds'; // seconds, minutes, hours, days
    }

    toJSON() {
        return {
            ...super.toJSON(),
            duration: this.duration,
            unit: this.unit
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.duration || this.duration <= 0) {
            errors.push('Duration must be greater than 0');
        }

        if (!['seconds', 'minutes', 'hours', 'days'].includes(this.unit)) {
            errors.push('Unit must be one of: seconds, minutes, hours, days');
        }

        return errors;
    }
}

module.exports = TimerCommand;