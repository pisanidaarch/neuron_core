// src/cross/entity/timeline_entry.js

/**
 * Timeline Entry Entity - Represents an entry in user's timeline
 * Used as DTO between layers
 */
class TimelineEntry {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userEmail = data.userEmail || null;
        this.type = data.type || null; // chat, command, system, error, workflow
        this.content = data.content || '';
        this.metadata = data.metadata || {};
        this.timestamp = data.timestamp || new Date().toISOString();
        this.tags = data.tags || [];
        this.relatedEntries = data.relatedEntries || [];
        this.aiModel = data.aiModel || null;
        this.tokens = data.tokens || null;
        this.duration = data.duration || null;
    }

    /**
     * Validate timeline entry entity
     * @returns {string[]} Array of validation errors
     */
    validate() {
        const errors = [];

        if (!this.userEmail) {
            errors.push('User email is required');
        } else if (!this.isValidEmail(this.userEmail)) {
            errors.push('Invalid email format');
        }

        if (!this.type) {
            errors.push('Entry type is required');
        } else if (!this.isValidType()) {
            errors.push('Invalid entry type. Must be: chat, command, system, error, or workflow');
        }

        if (!this.content) {
            errors.push('Content is required');
        } else if (typeof this.content !== 'string' && typeof this.content !== 'object') {
            errors.push('Content must be a string or object');
        }

        if (!this.timestamp) {
            errors.push('Timestamp is required');
        } else if (!this.isValidDate(this.timestamp)) {
            errors.push('Invalid timestamp format');
        }

        if (!Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
        }

        if (!Array.isArray(this.relatedEntries)) {
            errors.push('Related entries must be an array');
        }

        return errors;
    }

    /**
     * Check if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if date is valid ISO string
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Check if type is valid
     */
    isValidType() {
        const validTypes = ['chat', 'command', 'system', 'error', 'workflow'];
        return validTypes.includes(this.type);
    }

    /**
     * Add tag to entry
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
        return this;
    }

    /**
     * Remove tag from entry
     */
    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        return this;
    }

    /**
     * Check if entry has tag
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    /**
     * Add related entry
     */
    addRelatedEntry(entryId) {
        if (!this.relatedEntries.includes(entryId)) {
            this.relatedEntries.push(entryId);
        }
        return this;
    }

    /**
     * Get entry age in milliseconds
     */
    getAge() {
        return Date.now() - new Date(this.timestamp).getTime();
    }

    /**
     * Get entry age in human readable format
     */
    getHumanAge() {
        const age = this.getAge();
        const seconds = Math.floor(age / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }

    /**
     * Get content preview
     */
    getContentPreview(maxLength = 100) {
        let content = this.content;

        if (typeof content === 'object') {
            content = JSON.stringify(content);
        }

        if (content.length <= maxLength) {
            return content;
        }

        return content.substring(0, maxLength) + '...';
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            userEmail: this.userEmail,
            type: this.type,
            content: this.content,
            metadata: { ...this.metadata },
            timestamp: this.timestamp,
            tags: [...this.tags],
            relatedEntries: [...this.relatedEntries],
            aiModel: this.aiModel,
            tokens: this.tokens,
            duration: this.duration
        };
    }

    /**
     * Convert to safe JSON (for display)
     */
    toSafeJSON() {
        return {
            ...this.toJSON(),
            contentPreview: this.getContentPreview(),
            humanAge: this.getHumanAge()
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        return new TimelineEntry(data);
    }

    /**
     * Clone entry
     */
    clone() {
        return new TimelineEntry(this.toJSON());
    }

    /**
     * Update entry data
     */
    update(data) {
        if (data.type !== undefined) this.type = data.type;
        if (data.content !== undefined) this.content = data.content;
        if (data.metadata !== undefined) this.metadata = { ...data.metadata };
        if (data.tags !== undefined) this.tags = [...data.tags];
        if (data.relatedEntries !== undefined) this.relatedEntries = [...data.relatedEntries];
        if (data.aiModel !== undefined) this.aiModel = data.aiModel;
        if (data.tokens !== undefined) this.tokens = data.tokens;
        if (data.duration !== undefined) this.duration = data.duration;
        return this;
    }

    /**
     * Check equality
     */
    equals(other) {
        if (!(other instanceof TimelineEntry)) return false;
        return this.id === other.id && this.userEmail === other.userEmail;
    }

    /**
     * Create chat entry
     */
    static createChatEntry(userEmail, content, metadata = {}) {
        return new TimelineEntry({
            userEmail,
            type: 'chat',
            content,
            metadata: {
                ...metadata,
                source: 'user'
            }
        });
    }

    /**
     * Create command entry
     */
    static createCommandEntry(userEmail, commandName, commandData, metadata = {}) {
        return new TimelineEntry({
            userEmail,
            type: 'command',
            content: {
                name: commandName,
                data: commandData
            },
            metadata
        });
    }

    /**
     * Create system entry
     */
    static createSystemEntry(userEmail, message, metadata = {}) {
        return new TimelineEntry({
            userEmail,
            type: 'system',
            content: message,
            metadata: {
                ...metadata,
                system: true
            }
        });
    }

    /**
     * Create error entry
     */
    static createErrorEntry(userEmail, error, metadata = {}) {
        return new TimelineEntry({
            userEmail,
            type: 'error',
            content: {
                message: error.message || error,
                stack: error.stack || null,
                code: error.code || null
            },
            metadata
        });
    }
}

module.exports = TimelineEntry;