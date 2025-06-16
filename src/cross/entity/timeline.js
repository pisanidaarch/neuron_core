// src/cross/entity/timeline.js

/**
 * Timeline Entity - Represents timeline entries for user activities
 */
class Timeline {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId || '';
        this.userEmail = data.userEmail || '';
        this.aiName = data.aiName || '';
        this.action = data.action || '';
        this.category = data.category || 'general'; // general, ai, workflow, command, security, config
        this.inputData = data.inputData || null;
        this.outputData = data.outputData || null;
        this.inputSummary = data.inputSummary || '';
        this.outputSummary = data.outputSummary || '';
        this.status = data.status || 'success'; // success, error, pending, cancelled
        this.errorMessage = data.errorMessage || null;
        this.duration = data.duration || 0; // in milliseconds
        this.metadata = data.metadata || {};
        this.tags = data.tags || [];
        this.isSystemGenerated = data.isSystemGenerated || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.year = data.year || new Date().getFullYear();
        this.month = data.month || (new Date().getMonth() + 1);
        this.day = data.day || new Date().getDate();
        this.hour = data.hour || new Date().getHours();
        this.minute = data.minute || new Date().getMinutes();
    }

    /**
     * Generate unique ID for timeline entry
     * @returns {string}
     */
    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `timeline_${timestamp}_${random}`;
    }

    /**
     * Validate the timeline entity
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.userId || this.userId.trim().length === 0) {
            errors.push('User ID is required');
        }

        if (!this.userEmail || this.userEmail.trim().length === 0) {
            errors.push('User email is required');
        }

        if (!this.aiName || this.aiName.trim().length === 0) {
            errors.push('AI name is required');
        }

        if (!this.action || this.action.trim().length === 0) {
            errors.push('Action is required');
        }

        const validCategories = ['general', 'ai', 'workflow', 'command', 'security', 'config'];
        if (this.category && !validCategories.includes(this.category)) {
            errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }

        const validStatuses = ['success', 'error', 'pending', 'cancelled'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        if (this.duration && (typeof this.duration !== 'number' || this.duration < 0)) {
            errors.push('Duration must be a non-negative number');
        }

        if (!Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
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
            userId: this.userId,
            userEmail: this.userEmail,
            aiName: this.aiName,
            action: this.action,
            category: this.category,
            inputData: this.inputData,
            outputData: this.outputData,
            inputSummary: this.inputSummary,
            outputSummary: this.outputSummary,
            status: this.status,
            errorMessage: this.errorMessage,
            duration: this.duration,
            metadata: this.metadata,
            tags: this.tags,
            isSystemGenerated: this.isSystemGenerated,
            createdAt: this.createdAt,
            year: this.year,
            month: this.month,
            day: this.day,
            hour: this.hour,
            minute: this.minute
        };
    }

    /**
     * Create from plain object
     * @param {Object} data - Data object
     * @returns {Timeline}
     */
    static fromObject(data) {
        return new Timeline(data);
    }

    /**
     * Add tag to timeline entry
     * @param {string} tag - Tag name
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }

    /**
     * Remove tag from timeline entry
     * @param {string} tag - Tag name
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    }

    /**
     * Set error information
     * @param {string} errorMessage - Error message
     */
    setError(errorMessage) {
        this.status = 'error';
        this.errorMessage = errorMessage;
    }

    /**
     * Mark as completed successfully
     * @param {number} duration - Duration in milliseconds
     */
    setSuccess(duration = 0) {
        this.status = 'success';
        this.duration = duration;
        this.errorMessage = null;
    }

    /**
     * Set input and output summaries for AI search
     * @param {string} inputSummary - Summary of input
     * @param {string} outputSummary - Summary of output
     */
    setSummaries(inputSummary, outputSummary) {
        this.inputSummary = inputSummary || '';
        this.outputSummary = outputSummary || '';
    }

    /**
     * Get timeline entry namespace for storage
     * @returns {string}
     */
    getNamespace() {
        return this.userEmail.replace(/[@.]/g, '_');
    }

    /**
     * Get storage key for this timeline entry
     * @returns {string}
     */
    getStorageKey() {
        return `${this.year}_${this.month.toString().padStart(2, '0')}_${this.day.toString().padStart(2, '0')}_${this.id}`;
    }

    /**
     * Create timeline entry for AI interaction
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} action - Action performed
     * @param {Object} inputData - Input data
     * @param {Object} outputData - Output data
     * @returns {Timeline}
     */
    static createAIInteraction(userId, userEmail, aiName, action, inputData, outputData) {
        return new Timeline({
            userId,
            userEmail,
            aiName,
            action,
            category: 'ai',
            inputData,
            outputData
        });
    }

    /**
     * Create timeline entry for workflow execution
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} workflowId - Workflow ID
     * @param {Object} inputData - Input data
     * @param {Object} outputData - Output data
     * @returns {Timeline}
     */
    static createWorkflowExecution(userId, userEmail, aiName, workflowId, inputData, outputData) {
        return new Timeline({
            userId,
            userEmail,
            aiName,
            action: `workflow_execution:${workflowId}`,
            category: 'workflow',
            inputData,
            outputData,
            metadata: { workflowId }
        });
    }

    /**
     * Create timeline entry for command execution
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} commandId - Command ID
     * @param {Object} inputData - Input data
     * @param {Object} outputData - Output data
     * @returns {Timeline}
     */
    static createCommandExecution(userId, userEmail, aiName, commandId, inputData, outputData) {
        return new Timeline({
            userId,
            userEmail,
            aiName,
            action: `command_execution:${commandId}`,
            category: 'command',
            inputData,
            outputData,
            metadata: { commandId }
        });
    }

    /**
     * Create timeline entry for security action
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} action - Security action
     * @param {Object} metadata - Additional metadata
     * @returns {Timeline}
     */
    static createSecurityAction(userId, userEmail, aiName, action, metadata = {}) {
        return new Timeline({
            userId,
            userEmail,
            aiName,
            action,
            category: 'security',
            metadata,
            isSystemGenerated: true
        });
    }

    /**
     * Create timeline entry for configuration change
     * @param {string} userId - User ID
     * @param {string} userEmail - User email
     * @param {string} aiName - AI name
     * @param {string} configType - Configuration type
     * @param {Object} changes - Changes made
     * @returns {Timeline}
     */
    static createConfigChange(userId, userEmail, aiName, configType, changes) {
        return new Timeline({
            userId,
            userEmail,
            aiName,
            action: `config_change:${configType}`,
            category: 'config',
            inputData: changes,
            metadata: { configType }
        });
    }

    /**
     * Get date components from ISO string
     * @param {string} isoString - ISO date string
     * @returns {Object} Date components
     */
    static getDateComponents(isoString) {
        const date = new Date(isoString);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes()
        };
    }

    /**
     * Format duration for display
     * @param {number} duration - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    static formatDuration(duration) {
        if (duration < 1000) {
            return `${duration}ms`;
        } else if (duration < 60000) {
            return `${(duration / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }
}

module.exports = Timeline;