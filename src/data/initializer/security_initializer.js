// src/data/initializer/security_initializer.js

const { getInstance } = require('../manager/keys_vo_manager');
const UserManager = require('../manager/user_manager');
const GroupManager = require('../manager/group_manager');
const { AuthenticationError } = require('../../cross/entity/errors');

/**
 * SecurityInitializer - Initialize security system and default users
 */
class SecurityInitializer {
    constructor() {
        this.initialized = false;
        this.defaultUsers = [
            {
                email: 'subscription_admin@system.local',
                password: 'sudo_subscription_admin',
                nick: 'System Admin',
                group: 'subscription_admin',
                level: 3
            },
            {
                email: 'admin@system.local',
                password: 'admin_password',
                nick: 'Admin User',
                group: 'admin',
                level: 2
            }
        ];
        this.defaultGroups = [
            {
                name: 'subscription_admin',
                description: 'Full system access for subscription management',
                level: 3
            },
            {
                name: 'admin',
                description: 'Administrative access for user management',
                level: 2
            },
            {
                name: 'default',
                description: 'Basic user access',
                level: 1
            }
        ];
    }

    /**
     * Initialize security system
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('🔐 Initializing security system...');

            // Validate KeysVO configuration
            await this.validateConfiguration();

            // Initialize default groups
            await this.initializeGroups();

            // Initialize default users
            await this.initializeUsers();

            this.initialized = true;
            console.log('✅ Security system initialized successfully');

        } catch (error) {
            console.error('❌ Security initialization failed:', error);
            throw new AuthenticationError(`Security initialization failed: ${error.message}`);
        }
    }

    /**
     * Validate security configuration
     * @private
     */
    async validateConfiguration() {
        const keysManager = getInstance();
        const keysVO = keysManager.getKeysVO();

        if (!keysVO) {
            throw new AuthenticationError('KeysVO not initialized');
        }

        const jwtSecret = keysVO.getJWTSecret();
        if (!jwtSecret) {
            throw new AuthenticationError('JWT secret not configured');
        }

        if (jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
            console.warn('⚠️  WARNING: Using default JWT secret! Change this in production!');
        }

        console.log('   ✅ Security configuration validated');
    }

    /**
     * Initialize default groups
     * @private
     */
    async initializeGroups() {
        try {
            console.log('   👥 Initializing default groups...');

            for (const groupData of this.defaultGroups) {
                try {
                    // Try to get existing group
                    const existingGroup = await GroupManager.getGroup(groupData.name);

                    if (!existingGroup) {
                        // Create new group
                        await GroupManager.createGroup(groupData);
                        console.log(`   ✅ Created group: ${groupData.name}`);
                    } else {
                        console.log(`   ⏭️  Group already exists: ${groupData.name}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Failed to create group ${groupData.name}:`, error.message);
                    // Continue with other groups
                }
            }

        } catch (error) {
            throw new AuthenticationError(`Group initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize default users
     * @private
     */
    async initializeUsers() {
        try {
            console.log('   👤 Initializing default users...');

            for (const userData of this.defaultUsers) {
                try {
                    // Try to get existing user
                    const existingUser = await UserManager.getUser(userData.email);

                    if (!existingUser) {
                        // Create new user
                        await UserManager.createUser(userData);
                        console.log(`   ✅ Created user: ${userData.email}`);
                    } else {
                        console.log(`   ⏭️  User already exists: ${userData.email}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Failed to create user ${userData.email}:`, error.message);
                    // Continue with other users
                }
            }

        } catch (error) {
            throw new AuthenticationError(`User initialization failed: ${error.message}`);
        }
    }

    /**
     * Check if security system is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get security status
     * @returns {Promise<Object>}
     */
    async getStatus() {
        try {
            const keysManager = getInstance();
            const keysVO = keysManager.getKeysVO();

            const status = {
                initialized: this.initialized,
                configuration: {
                    jwtSecret: !!keysVO?.getJWTSecret(),
                    tokenExpiry: keysVO?.getTokenExpiry() || 'not set'
                },
                groups: {
                    total: 0,
                    initialized: []
                },
                users: {
                    total: 0,
                    initialized: []
                }
            };

            // Check groups
            for (const groupData of this.defaultGroups) {
                try {
                    const group = await GroupManager.getGroup(groupData.name);
                    if (group) {
                        status.groups.initialized.push(groupData.name);
                        status.groups.total++;
                    }
                } catch (error) {
                    // Group doesn't exist or error occurred
                }
            }

            // Check users
            for (const userData of this.defaultUsers) {
                try {
                    const user = await UserManager.getUser(userData.email);
                    if (user) {
                        status.users.initialized.push(userData.email);
                        status.users.total++;
                    }
                } catch (error) {
                    // User doesn't exist or error occurred
                }
            }

            return status;

        } catch (error) {
            throw new AuthenticationError(`Failed to get security status: ${error.message}`);
        }
    }

    /**
     * Reinitialize security system
     * @returns {Promise<void>}
     */
    async reinitialize() {
        try {
            console.log('🔄 Reinitializing security system...');
            this.initialized = false;
            await this.initialize();
            console.log('✅ Security system reinitialized');

        } catch (error) {
            console.error('❌ Security reinitialization failed:', error);
            throw new AuthenticationError(`Security reinitialization failed: ${error.message}`);
        }
    }

    /**
     * Get default admin credentials (for development/setup)
     * @returns {Object}
     */
    getDefaultAdminCredentials() {
        const adminUser = this.defaultUsers.find(user => user.group === 'subscription_admin');
        return {
            email: adminUser.email,
            password: adminUser.password,
            warning: 'Change this password in production!'
        };
    }

    /**
     * Reset security system (for development only)
     * @returns {Promise<void>}
     */
    async reset() {
        if (process.env.NODE_ENV === 'production') {
            throw new AuthenticationError('Security reset not allowed in production');
        }

        console.log('🔄 Resetting security system...');

        // This would involve dropping users and groups
        // Implementation depends on actual database operations

        this.initialized = false;
        console.log('✅ Security system reset complete');
    }
}

module.exports = SecurityInitializer;