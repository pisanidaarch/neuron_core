  // src/cross/entity/command.js

/**
 * Command - Command entity for workflows
 */
class Command {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.type = data.type || 'root'; // root, frontend, database, script, ai, if, timer, goto, alert, cancel
        this.parent_id = data.parent_id || null;
        this.user_email = data.user_email || '';
        this.database = data.database || 'user-data';
        this.namespace = data.namespace || '';
        this.params = data.params || {};
        this.bags = data.bags || {};
        this.children = data.children || [];
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.active = data.active !== undefined ? data.active : true;
    }

    /**
     * Validate command
     * @returns {Object}
     */
    validate() {
        const errors = [];

        if (!this.name) {
            errors.push('Command name is required');
        }

        if (!this.type) {
            errors.push('Command type is required');
        }

        const validTypes = ['root', 'frontend', 'database', 'script', 'ai', 'if', 'timer', 'goto', 'alert', 'cancel'];
        if (!validTypes.includes(this.type)) {
            errors.push(`Invalid command type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (!this.user_email) {
            errors.push('User email is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Add child command
     * @param {Command} childCommand - Child command
     */
    addChild(childCommand) {
        childCommand.parent_id = this.id;
        this.children.push(childCommand);
        this.updated_at = new Date().toISOString();
    }

    /**
     * Set parameter
     * @param {string} key - Parameter key
     * @param {*} value - Parameter value
     */
    setParam(key, value) {
        this.params[key] = value;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Set bag
     * @param {string} name - Bag name
     * @param {*} value - Bag value
     */
    setBag(name, value) {
        this.bags[name] = value;
        this.updated_at = new Date().toISOString();
    }

    /**
     * Convert to JSON for storage
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            type: this.type,
            parent_id: this.parent_id,
            user_email: this.user_email,
            database: this.database,
            namespace: this.namespace,
            params: this.params,
            bags: this.bags,
            children: this.children.map(child => child.toJSON()),
            created_at: this.created_at,
            updated_at: this.updated_at,
            active: this.active
        };
    }

    /**
     * Create from NeuronDB data
     * @param {string} id - Command ID
     * @param {Object} data - Data from NeuronDB
     * @returns {Command}
     */
    static fromNeuronDB(id, data) {
        const command = new Command({
            id,
            ...data
        });

        // Convert children back to Command instances
        if (data.children && Array.isArray(data.children)) {
            command.children = data.children.map((childData, index) =>
                Command.fromNeuronDB(`${id}_child_${index}`, childData)
            );
        }

        return command;
    }
}

module.exports = Command;

