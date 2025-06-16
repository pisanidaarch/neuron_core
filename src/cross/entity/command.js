// src/cross/entity/command.js

/**
 * Command Entity - Represents a command in the workflow system
 */
class Command {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.commandType = data.commandType || 'custom'; // custom, ai_cmd, ndb_cmd, bag_cmd, front_end_cmd, js_cmd, if_cmd, goto_cmd, bash_cmd
        this.category = data.category || 'general';
        this.version = data.version || '1.0.0';
        this.parameters = data.parameters || [];
        this.inputSchema = data.inputSchema || {};
        this.outputSchema = data.outputSchema || {};
        this.code = data.code || '';
        this.dependencies = data.dependencies || [];
        this.tags = data.tags || [];
        this.isSystem = data.isSystem || false;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.authorId = data.authorId || '';
        this.aiName = data.aiName || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate the command entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.id || this.id.trim().length === 0) {
            errors.push('Command ID is required');
        }

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Command name is required');
        }

        if (this.name && this.name.length > 100) {
            errors.push('Command name must be 100 characters or less');
        }

        if (!this.commandType) {
            errors.push('Command type is required');
        }

        const validTypes = ['custom', 'ai_cmd', 'ndb_cmd', 'bag_cmd', 'front_end_cmd', 'js_cmd', 'if_cmd', 'goto_cmd', 'bash_cmd'];
        if (this.commandType && !validTypes.includes(this.commandType)) {
            errors.push(`Invalid command type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (!Array.isArray(this.parameters)) {
            errors.push('Parameters must be an array');
        }

        if (!Array.isArray(this.dependencies)) {
            errors.push('Dependencies must be an array');
        }

        if (!Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
        }

        if (!this.aiName || this.aiName.trim().length === 0) {
            errors.push('AI name is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            commandType: this.commandType,
            category: this.category,
            version: this.version,
            parameters: this.parameters,
            inputSchema: this.inputSchema,
            outputSchema: this.outputSchema,
            code: this.code,
            dependencies: this.dependencies,
            tags: this.tags,
            isSystem: this.isSystem,
            isActive: this.isActive,
            authorId: this.authorId,
            aiName: this.aiName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {Command}
     */
    static fromObject(data) {
        return new Command(data);
    }

    /**
     * Add parameter to command
     * @param {Object} parameter - Parameter object
     */
    addParameter(parameter) {
        if (!parameter.name) {
            throw new Error('Parameter name is required');
        }

        // Check if parameter already exists
        const existingIndex = this.parameters.findIndex(p => p.name === parameter.name);
        if (existingIndex >= 0) {
            this.parameters[existingIndex] = parameter;
        } else {
            this.parameters.push(parameter);
        }

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Remove parameter from command
     * @param {string} parameterName - Parameter name
     */
    removeParameter(parameterName) {
        const index = this.parameters.findIndex(p => p.name === parameterName);
        if (index >= 0) {
            this.parameters.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Add dependency
     * @param {string} dependency - Dependency command ID
     */
    addDependency(dependency) {
        if (!this.dependencies.includes(dependency)) {
            this.dependencies.push(dependency);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove dependency
     * @param {string} dependency - Dependency command ID
     */
    removeDependency(dependency) {
        const index = this.dependencies.indexOf(dependency);
        if (index >= 0) {
            this.dependencies.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Add tag
     * @param {string} tag - Tag name
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove tag
     * @param {string} tag - Tag name
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index >= 0) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Get command type configurations
     * @returns {Object}
     */
    static getCommandTypes() {
        return {
            'custom': {
                name: 'Custom Command',
                description: 'User-defined custom command',
                requiredFields: ['code'],
                supportedLanguages: ['javascript', 'python', 'bash']
            },
            'ai_cmd': {
                name: 'AI Command',
                description: 'Command that interacts with AI services',
                requiredFields: ['aiProvider', 'prompt'],
                supportedProviders: ['gpt', 'gemini', 'claude', 'grok', 'llama']
            },
            'ndb_cmd': {
                name: 'NeuronDB Command',
                description: 'Command that executes SNL on NeuronDB',
                requiredFields: ['snlCommand'],
                supportedOperations: ['set', 'view', 'list', 'remove', 'search', 'match']
            },
            'bag_cmd': {
                name: 'Bag Command',
                description: 'Command for data bag operations',
                requiredFields: ['operation', 'bagName'],
                supportedOperations: ['create', 'read', 'update', 'delete', 'merge']
            },
            'front_end_cmd': {
                name: 'Frontend Command',
                description: 'Command that updates frontend interface',
                requiredFields: ['uiAction', 'componentId'],
                supportedActions: ['update', 'show', 'hide', 'redirect', 'alert']
            },
            'js_cmd': {
                name: 'JavaScript Command',
                description: 'Command that executes JavaScript code',
                requiredFields: ['code'],
                runtime: 'v8_engine'
            },
            'if_cmd': {
                name: 'Conditional Command',
                description: 'Command for conditional logic',
                requiredFields: ['condition', 'trueAction', 'falseAction'],
                supportedOperators: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith']
            },
            'goto_cmd': {
                name: 'Goto Command',
                description: 'Command for workflow control flow',
                requiredFields: ['targetCommand'],
                supportedTypes: ['jump', 'call', 'return']
            },
            'bash_cmd': {
                name: 'Bash Command',
                description: 'Command that executes bash scripts',
                requiredFields: ['script'],
                security: 'restricted_environment'
            }
        };
    }

    /**
     * Create a default parameter structure
     * @param {string} name - Parameter name
     * @param {string} type - Parameter type
     * @param {string} description - Parameter description
     * @param {boolean} required - Is parameter required
     * @param {any} defaultValue - Default value
     * @returns {Object}
     */
    static createParameter(name, type = 'string', description = '', required = false, defaultValue = null) {
        return {
            name,
            type,
            description,
            required,
            defaultValue,
            validation: null
        };
    }

    /**
     * Create example commands for each type
     * @param {string} aiName - AI name
     * @returns {Array<Command>}
     */
    static createExampleCommands(aiName) {
        const examples = [];

        // AI Command example
        examples.push(new Command({
            id: 'ai_hello_world',
            name: 'AI Hello World',
            description: 'Simple AI greeting command',
            commandType: 'ai_cmd',
            category: 'examples',
            parameters: [
                Command.createParameter('name', 'string', 'Name to greet', true),
                Command.createParameter('language', 'string', 'Language for greeting', false, 'english')
            ],
            code: 'Generate a greeting for {name} in {language}',
            aiName: aiName,
            isSystem: true
        }));

        // NDB Command example
        examples.push(new Command({
            id: 'ndb_list_users',
            name: 'List Users',
            description: 'List all users in the system',
            commandType: 'ndb_cmd',
            category: 'admin',
            parameters: [
                Command.createParameter('database', 'string', 'Database name', true, 'main')
            ],
            code: 'list(structure)\nvalues("*")\non({database}.core.users)',
            aiName: aiName,
            isSystem: true
        }));

        // JavaScript Command example
        examples.push(new Command({
            id: 'js_calculate',
            name: 'Calculate Expression',
            description: 'Calculate mathematical expression',
            commandType: 'js_cmd',
            category: 'math',
            parameters: [
                Command.createParameter('expression', 'string', 'Mathematical expression', true)
            ],
            code: 'const result = eval(parameters.expression); return { result };',
            aiName: aiName,
            isSystem: true
        }));

        return examples;
    }
}

module.exports = Command;