// src/data/snl/base_snl.js

/**
 * Base class for all SNL command generators
 * Provides validation and common functionality
 */
class BaseSNL {
    constructor() {
        this.validCommands = ['set', 'list', 'view', 'search', 'match', 'remove', 'drop', 'tag', 'untag', 'audit'];
        this.validEntityTypes = ['enum', 'structure', 'pointer', 'ipointer'];
    }

    /**
     * Validate command
     */
    validateCommand(command) {
        if (!this.validCommands.includes(command)) {
            throw new Error(`Invalid command: ${command}. Valid commands: ${this.validCommands.join(', ')}`);
        }
    }

    /**
     * Validate entity type
     */
    validateEntityType(type) {
        if (!this.validEntityTypes.includes(type)) {
            throw new Error(`Invalid entity type: ${type}. Valid types: ${this.validEntityTypes.join(', ')}`);
        }
    }

    /**
     * Escape value for SNL
     */
    escapeValue(value) {
        if (typeof value === 'string') {
            return value.replace(/"/g, '\\"');
        }
        return value;
    }

    /**
     * Build SNL command
     */
    buildSNL(command, entityType, values = null, path = null) {
        this.validateCommand(command);
        this.validateEntityType(entityType);

        let snl = `${command}(${entityType})`;

        if (values !== null && values !== undefined) {
            if (Array.isArray(values)) {
                const formattedValues = values.map(v =>
                    typeof v === 'string' ? `"${this.escapeValue(v)}"` : JSON.stringify(v)
                ).join(', ');
                snl += `\nvalues(${formattedValues})`;
            } else if (typeof values === 'object') {
                snl += `\nvalues(${JSON.stringify(values)})`;
            } else {
                snl += `\nvalues("${this.escapeValue(values)}")`;
            }
        }

        if (path) {
            snl += `\non(${path})`;
        } else {
            snl += `\non()`;
        }

        return snl;
    }

    /**
     * Build path from components
     */
    buildPath(database = null, namespace = null, entity = null) {
        const parts = [];
        if (database) parts.push(database);
        if (namespace) parts.push(namespace);
        if (entity) parts.push(entity);
        return parts.join('.');
    }

    /**
     * Format email for namespace (replace . and @ to be SNL compatible)
     */
    formatEmailForNamespace(email) {
        return email.replace(/\./g, '_').replace('@', '_at_');
    }

    /**
     * Parse email from namespace format
     */
    parseEmailFromNamespace(namespace) {
        return namespace.replace('_at_', '@').replace(/_/g, '.');
    }

    /**
     * Validate SNL syntax
     */
    validateSNLSyntax(snl) {
        const lines = snl.split('\n').map(l => l.trim()).filter(l => l);

        if (lines.length === 0) {
            throw new Error('Empty SNL command');
        }

        // Check first line has command(type) format
        const commandPattern = /^(set|list|view|search|match|remove|drop|tag|untag|audit)\((enum|structure|pointer|ipointer)\)$/;
        if (!commandPattern.test(lines[0])) {
            throw new Error(`Invalid SNL command format: ${lines[0]}`);
        }

        // Extract command for validation
        const command = lines[0].split('(')[0];

        // Check values() line if present
        const valuesLine = lines.find(l => l.startsWith('values('));
        if (valuesLine) {
            // Commands that should NOT have values
            if (['view', 'drop'].includes(command)) {
                throw new Error(`Command ${command} should not have values() clause`);
            }
        }

        // Check on() line
        const onLine = lines.find(l => l.startsWith('on('));
        if (!onLine) {
            throw new Error('Missing on() clause');
        }

        return true;
    }
}

module.exports = BaseSNL;