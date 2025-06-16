  // src/cross/entity/command.js

/**
 * Command entity - Base command structure
 */
class Command {
    constructor(data = {}) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.description = data.description || '';
        this.commandType = data.commandType || 'root';
        this.parentId = data.parentId || null;
        this.order = data.order || 0;
        this.config = data.config || {};
        this.children = data.children || [];
        this.timeout = data.timeout || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy || '';
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            commandType: this.commandType,
            parentId: this.parentId,
            order: this.order,
            config: this.config,
            children: this.children,
            timeout: this.timeout,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy
        };
    }

    /**
     * Validate command data
     */
    validate() {
        const errors = [];

        if (!this.name.trim()) {
            errors.push('Command name is required');
        }

        if (!this.commandType) {
            errors.push('Command type is required');
        }

        if (this.order < 0) {
            errors.push('Order must be non-negative');
        }

        return errors;
    }
}

module.exports = Command;

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

// src/cross/entity/database_command.js

const Command = require('./command');

/**
 * Database Command - SNL execution commands
 */
class DatabaseCommand extends Command {
    constructor(data = {}) {
        super({ ...data, commandType: 'database' });
        this.snlTemplate = data.snlTemplate || '';
        this.database = data.database || '';
        this.namespace = data.namespace || '';
        this.entity = data.entity || '';
        this.operation = data.operation || 'view';
        this.fieldMappings = data.fieldMappings || [];
        this.outputBag = data.outputBag || 'latest';
    }

    toJSON() {
        return {
            ...super.toJSON(),
            snlTemplate: this.snlTemplate,
            database: this.database,
            namespace: this.namespace,
            entity: this.entity,
            operation: this.operation,
            fieldMappings: this.fieldMappings,
            outputBag: this.outputBag
        };
    }

    validate() {
        const errors = super.validate();

        if (!this.snlTemplate.trim() && !this.operation) {
            errors.push('Either SNL template or operation is required');
        }

        if (this.operation && !this.database) {
            errors.push('Database is required when using operation');
        }

        const validOperations = ['set', 'remove', 'drop', 'view', 'list', 'search', 'match', 'audit'];
        if (this.operation && !validOperations.includes(this.operation)) {
            errors.push(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
        }

        return errors;
    }
}

module.exports = DatabaseCommand;

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