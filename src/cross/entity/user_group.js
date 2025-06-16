// src/cross/entity/user_group.js

/**
 * UserGroup entity for NeuronCore security module
 */
class UserGroup {
    constructor(data = {}) {
        this.name = data.name || '';
        this.description = data.description || '';
        this.members = data.members || []; // Array of user emails
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
        this.hidden = data.hidden || false; // For system groups like subscription_admin
        this.system_group = data.system_group || false; // Cannot be deleted
    }

    /**
     * Create group from NeuronDB response
     * @param {string} name - Group name
     * @param {Object} data - Group data from NeuronDB
     * @returns {UserGroup}
     */
    static fromNeuronDB(name, data) {
        return new UserGroup({
            name,
            description: data.description || '',
            members: data.members || [],
            created_at: data.created_at,
            updated_at: data.updated_at,
            hidden: data.hidden || false,
            system_group: data.system_group || false
        });
    }

    /**
     * Convert to NeuronDB format
     * @returns {Object}
     */
    toNeuronDB() {
        return {
            description: this.description,
            members: this.members,
            created_at: this.created_at,
            updated_at: this.updated_at,
            hidden: this.hidden,
            system_group: this.system_group
        };
    }

    /**
     * Validate group data
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.length < 2) {
            errors.push('Group name must be at least 2 characters');
        }

        if (this.name && !/^[a-zA-Z0-9_-]+$/.test(this.name)) {
            errors.push('Group name can only contain letters, numbers, underscore and dash');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Add member to group
     * @param {string} email - User email
     */
    addMember(email) {
        if (!this.members.includes(email)) {
            this.members.push(email);
            this.updated_at = new Date().toISOString();
        }
    }

    /**
     * Remove member from group
     * @param {string} email - User email
     */
    removeMember(email) {
        const index = this.members.indexOf(email);
        if (index > -1) {
            this.members.splice(index, 1);
            this.updated_at = new Date().toISOString();
        }
    }

    /**
     * Check if user is member of group
     * @param {string} email - User email
     * @returns {boolean}
     */
    hasMember(email) {
        return this.members.includes(email);
    }

    /**
     * Get member count
     * @returns {number}
     */
    getMemberCount() {
        return this.members.length;
    }

    /**
     * Create system group (subscription_admin, admin, default)
     * @param {string} name - Group name
     * @param {string} description - Group description
     * @returns {UserGroup}
     */
    static createSystemGroup(name, description) {
        return new UserGroup({
            name,
            description,
            members: [],
            system_group: true,
            hidden: name === 'subscription_admin' // Only subscription_admin is hidden
        });
    }
}

module.exports = UserGroup;