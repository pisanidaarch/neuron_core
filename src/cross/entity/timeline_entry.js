// src/cross/entity/timeline_entry.js

/**
 * Timeline Entry entity
 */
class TimelineEntry {
    constructor(data = {}) {
        this.id = data.id || '';
        this.timestamp = data.timestamp || new Date().toISOString();
        this.userInput = data.userInput || '';
        this.aiResponse = data.aiResponse || '';
        this.summary = data.summary || null;
        this.tags = data.tags || [];
        this.userEmail = data.userEmail || '';
        this.aiName = data.aiName || '';
        this.metadata = data.metadata || {};
    }

    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            userInput: this.userInput,
            aiResponse: this.aiResponse,
            summary: this.summary,
            tags: this.tags,
            userEmail: this.userEmail,
            aiName: this.aiName,
            metadata: this.metadata
        };
    }

    validate() {
        const errors = [];

        if (!this.userInput.trim() && !this.aiResponse.trim()) {
            errors.push('Either user input or AI response is required');
        }

        if (!this.userEmail.trim()) {
            errors.push('User email is required');
        }

        if (!this.aiName.trim()) {
            errors.push('AI name is required');
        }

        return errors;
    }

    /**
     * Generate entry ID based on timestamp
     */
    generateId() {
        const date = new Date(this.timestamp);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const hour = date.getUTCHours().toString().padStart(2, '0');
        const minute = date.getUTCMinutes().toString().padStart(2, '0');
        const second = date.getUTCSeconds().toString().padStart(2, '0');
        const ms = date.getUTCMilliseconds().toString().padStart(3, '0');

        this.id = `${day}_${hour}_${minute}_${second}_${ms}`;
        return this.id;
    }

    /**
     * Get year-month entity name for timeline storage
     */
    getEntityName() {
        const date = new Date(this.timestamp);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }
}

module.exports = TimelineEntry;

// src/cross/entity/ai_config.js

/**
 * AI Configuration entity
 */
class AIConfig {
    constructor(data = {}) {
        this.aiName = data.aiName || '';
        this.theme = data.theme || this._getDefaultTheme();
        this.behavior = data.behavior || this._getDefaultBehavior();
        this.logo = data.logo || '';
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        this.updatedBy = data.updatedBy || '';
    }

    _getDefaultTheme() {
        return {
            // Principais
            primaryColors: {
                black: '#000000',
                white: '#FFFFFF',
                darkBlue: '#0363AE',
                darkPurple: '#50038F'
            },
            // Secundárias
            secondaryColors: {
                purple: '#6332F5',
                turquoise: '#54D3EC',
                blue: '#2F62CD',
                teal: '#3AA3A9'
            },
            // Gradientes
            gradients: {
                purpleDarkBlue: 'linear-gradient(135deg, #50038F 0%, #0363AE 100%)',
                purpleTurquoise: 'linear-gradient(135deg, #6332F5 0%, #54D3EC 100%)'
            }
        };
    }

    _getDefaultBehavior() {
        return {
            greeting: 'Hello! How can I assist you today?',
            personality: 'helpful',
            defaultContext: 'You are a helpful AI assistant.',
            responseStyle: 'conversational'
        };
    }

    toJSON() {
        return {
            aiName: this.aiName,
            theme: this.theme,
            behavior: this.behavior,
            logo: this.logo,
            lastUpdated: this.lastUpdated,
            updatedBy: this.updatedBy
        };
    }

    validate() {
        const errors = [];

        if (!this.aiName.trim()) {
            errors.push('AI name is required');
        }

        // Validate theme structure
        if (!this.theme.primaryColors || !this.theme.secondaryColors || !this.theme.gradients) {
            errors.push('Complete theme configuration is required');
        }

        return errors;
    }

    /**
     * Update theme colors
     */
    updateTheme(newTheme) {
        this.theme = { ...this.theme, ...newTheme };
        this.lastUpdated = new Date().toISOString();
    }

    /**
     * Update behavior settings
     */
    updateBehavior(newBehavior) {
        this.behavior = { ...this.behavior, ...newBehavior };
        this.lastUpdated = new Date().toISOString();
    }
}

module.exports = AIConfig;

// src/cross/entity/database_info.js

/**
 * Database Information entity
 */
class DatabaseInfo {
    constructor(data = {}) {
        this.name = data.name || '';
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdBy = data.createdBy || '';
        this.namespaces = data.namespaces || [];
        this.permissions = data.permissions || [];
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            createdAt: this.createdAt,
            createdBy: this.createdBy,
            namespaces: this.namespaces,
            permissions: this.permissions
        };
    }

    validate() {
        const errors = [];

        if (!this.name.trim()) {
            errors.push('Database name is required');
        }

        // Validate name format (alphanumeric, dash, underscore)
        if (!/^[a-zA-Z0-9_-]+$/.test(this.name)) {
            errors.push('Database name can only contain letters, numbers, dashes, and underscores');
        }

        return errors;
    }
}

module.exports = DatabaseInfo;

// src/cross/entity/namespace_info.js

/**
 * Namespace Information entity
 */
class NamespaceInfo {
    constructor(data = {}) {
        this.name = data.name || '';
        this.database = data.database || '';
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdBy = data.createdBy || '';
        this.entities = data.entities || [];
    }

    toJSON() {
        return {
            name: this.name,
            database: this.database,
            description: this.description,
            createdAt: this.createdAt,
            createdBy: this.createdBy,
            entities: this.entities
        };
    }

    validate() {
        const errors = [];

        if (!this.name.trim()) {
            errors.push('Namespace name is required');
        }

        if (!this.database.trim()) {
            errors.push('Database name is required');
        }

        // Validate name format
        if (!/^[a-zA-Z0-9_-]+$/.test(this.name)) {
            errors.push('Namespace name can only contain letters, numbers, dashes, and underscores');
        }

        return errors;
    }
}

module.exports = NamespaceInfo;

// src/cross/entity/tag_info.js

/**
 * Tag Information entity
 */
class TagInfo {
    constructor(data = {}) {
        this.name = data.name || '';
        this.database = data.database || '';
        this.namespace = data.namespace || '';
        this.entity = data.entity || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdBy = data.createdBy || '';
    }

    toJSON() {
        return {
            name: this.name,
            database: this.database,
            namespace: this.namespace,
            entity: this.entity,
            createdAt: this.createdAt,
            createdBy: this.createdBy
        };
    }

    validate() {
        const errors = [];

        if (!this.name.trim()) {
            errors.push('Tag name is required');
        }

        if (!this.database.trim()) {
            errors.push('Database is required');
        }

        if (!this.namespace.trim()) {
            errors.push('Namespace is required');
        }

        if (!this.entity.trim()) {
            errors.push('Entity is required');
        }

        return errors;
    }

    /**
     * Get full entity path
     */
    getFullPath() {
        return `${this.database}.${this.namespace}.${this.entity}`;
    }
}

module.exports = TagInfo;

// src/cross/entity/bag.js

/**
 * Bag entity - Variable storage for workflows
 */
class Bag {
    constructor(data = {}) {
        this.name = data.name || '';
        this.value = data.value || null;
        this.type = data.type || 'string'; // string, number, boolean, object, array
        this.description = data.description || '';
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        this.sourceStep = data.sourceStep || '';
    }

    toJSON() {
        return {
            name: this.name,
            value: this.value,
            type: this.type,
            description: this.description,
            lastUpdated: this.lastUpdated,
            sourceStep: this.sourceStep
        };
    }

    validate() {
        const errors = [];

        if (!this.name.trim()) {
            errors.push('Bag name is required');
        }

        // Validate name format (alphanumeric and underscore only)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.name)) {
            errors.push('Bag name must start with letter or underscore and contain only letters, numbers, and underscores');
        }

        if (!['string', 'number', 'boolean', 'object', 'array'].includes(this.type)) {
            errors.push('Invalid bag type');
        }

        return errors;
    }

    /**
     * Set value with type validation
     */
    setValue(value, sourceStep = '') {
        this.value = value;
        this.lastUpdated = new Date().toISOString();
        this.sourceStep = sourceStep;

        // Auto-detect type if not set
        if (this.type === 'string' && typeof value !== 'string') {
            if (typeof value === 'number') this.type = 'number';
            else if (typeof value === 'boolean') this.type = 'boolean';
            else if (Array.isArray(value)) this.type = 'array';
            else if (typeof value === 'object') this.type = 'object';
        }
    }
}

module.exports = Bag;

// src/cross/entity/snl_request.js

/**
 * SNL Request entity
 */
class SNLRequest {
    constructor(data = {}) {
        this.command = data.command || '';
        this.aiName = data.aiName || '';
        this.userEmail = data.userEmail || '';
        this.token = data.token || '';
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    toJSON() {
        return {
            command: this.command,
            aiName: this.aiName,
            userEmail: this.userEmail,
            token: this.token,
            timestamp: this.timestamp
        };
    }

    validate() {
        const errors = [];

        if (!this.command.trim()) {
            errors.push('SNL command is required');
        }

        if (!this.aiName.trim()) {
            errors.push('AI name is required');
        }

        if (!this.userEmail.trim()) {
            errors.push('User email is required');
        }

        if (!this.token.trim()) {
            errors.push('Token is required');
        }

        return errors;
    }
}

module.exports = SNLRequest;

// src/cross/entity/snl_response.js

/**
 * SNL Response entity
 */
class SNLResponse {
    constructor(data = {}) {
        this.success = data.success || false;
        this.data = data.data || null;
        this.error = data.error || null;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.executionTime = data.executionTime || 0;
    }

    toJSON() {
        return {
            success: this.success,
            data: this.data,
            error: this.error,
            timestamp: this.timestamp,
            executionTime: this.executionTime
        };
    }

    /**
     * Set success response
     */
    setSuccess(data, executionTime = 0) {
        this.success = true;
        this.data = data;
        this.error = null;
        this.executionTime = executionTime;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Set error response
     */
    setError(error, executionTime = 0) {
        this.success = false;
        this.data = null;
        this.error = error;
        this.executionTime = executionTime;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = SNLResponse;