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