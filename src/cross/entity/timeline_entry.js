// src/cross/entity/timeline_entry.js

/**
 * TimelineEntry - Timeline entry entity
 */
class TimelineEntry {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_email = data.user_email || '';
        this.entity_name = data.entity_name || 'general';
        this.ai_name = data.ai_name || '';
        this.input_type = data.input_type || 'text'; // text, file, voice
        this.input = data.input || '';
        this.output_type = data.output_type || 'text'; // text, file, voice
        this.output = data.output || '';
        this.summary = data.summary || '';
        this.tags = data.tags || [];
        this.timestamp = data.timestamp || new Date().toISOString();
        this.context = data.context || {};
        this.metadata = data.metadata || {};
    }

    /**
     * Validate timeline entry
     * @returns {Object}
     */
    validate() {
        const errors = [];

        if (!this.user_email) {
            errors.push('User email is required');
        }

        if (!this.input && !this.output) {
            errors.push('Either input or output is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate summary from input/output
     */
    generateSummary() {
        if (this.summary) return;

        let summaryText = '';

        if (this.input) {
            summaryText += `Input: ${this.input.substring(0, 100)}`;
        }

        if (this.output) {
            if (summaryText) summaryText += ' | ';
            summaryText += `Output: ${this.output.substring(0, 100)}`;
        }

        this.summary = summaryText.substring(0, 200);
    }

    /**
     * Convert to JSON for storage
     * @returns {Object}
     */
    toJSON() {
        return {
            user_email: this.user_email,
            entity_name: this.entity_name,
            ai_name: this.ai_name,
            input_type: this.input_type,
            input: this.input,
            output_type: this.output_type,
            output: this.output,
            summary: this.summary,
            tags: this.tags,
            timestamp: this.timestamp,
            context: this.context,
            metadata: this.metadata
        };
    }

    /**
     * Create from NeuronDB data
     * @param {string} id - Entry ID
     * @param {Object} data - Data from NeuronDB
     * @returns {TimelineEntry}
     */
    static fromNeuronDB(id, data) {
        return new TimelineEntry({
            id,
            ...data
        });
    }
}

module.exports = TimelineEntry;

