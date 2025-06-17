// src/data/initializer/security_initializer.js

const AuthManager = require('../manager/auth_manager');
const UserGroupManager = require('../manager/user_group_manager');
const UserGroupSNL = require('../snl/user_group_snl');
const AISender = require('../neuron_db/ai_sender');
const { getInstance } = require('../manager/keys_vo_manager');

/**
 * Security Initializer - Initialize security-related structures
 */
class SecurityInitializer {
    constructor() {
        this.authManager = new AuthManager();
        this.groupManager = new UserGroupManager();
        this.groupSNL = new UserGroupSNL();
    }

    /**
     * Initialize security for all AI instances
     * @returns {Promise<void>}
     */
    async initializeAll() {
        try {
            console.log('🔒 Starting security initialization...');

            // Get KeysVO instance
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            // Initialize security for each AI instance
            for (const aiName of keysVO.getAINames()) {
                console.log(`   📋 Initializing security for AI: ${aiName}`);
                await this.initializeAI(aiName, keysVO);
            }

            console.log('✅ Security initialization completed successfully');

        } catch (error) {
            console.error('❌ Security initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize security for specific AI
     * @param {string} aiName - AI name
     * @param {Object} keysVO - KeysVO instance
     * @returns {Promise<void>}
     */
    async initializeAI(aiName, keysVO) {
        try {
            const aiUrl = keysVO.getAIUrl(aiName);
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiUrl || !aiToken) {
                console.warn(`   ⚠️  Skipping AI ${aiName}: missing URL or token`);
                return;
            }

            // Create and initialize AI sender
            const aiSender = new AISender();
            aiSender.initialize(aiUrl, aiToken);

            // Initialize managers
            this.authManager.initialize(aiSender);
            this.groupManager.initialize(aiSender);

            // 1. Initialize default groups
            await this.initializeDefaultGroups(aiName);

            // 2. Create subscription admin user
            await this.createSubscriptionAdminUser(aiName);

            console.log(`   ✅ Security initialized for AI: ${aiName}`);

        } catch (error) {
            console.error(`   ❌ Failed to initialize security for AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize default groups for AI instance
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async initializeDefaultGroups(aiName) {
        try {
            console.log(`     🔰 Initializing groups for ${aiName}...`);

            await this.groupManager.initializeDefaultGroups();

            console.log(`     ✅ Groups initialized for ${aiName}`);

        } catch (error) {
            console.error(`     ❌ Failed to initialize groups for ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Create subscription admin user
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async createSubscriptionAdminUser(aiName) {
        try {
            console.log(`     👤 Creating subscription admin user for ${aiName}...`);

            const adminCredentials = this.groupSNL.getDefaultSubscriptionAdminCredentials();

            // Check if user already exists
            const existingUser = await this.authManager.getUser(adminCredentials.email);

            if (existingUser) {
                console.log(`     ✓ Subscription admin user already exists for ${aiName}`);
                return;
            }

            // Create the user using sender directly (no admin token needed for system creation)
            const userData = {
                email: adminCredentials.email,
                password: adminCredentials.password,
                nick: adminCredentials.nick,
                permissions: adminCredentials.permissions,
                isSystem: true,
                created_at: new Date().toISOString()
            };

            // Use sender directly to create system user
            await this.createSystemUser(userData);

            // Add to subscription_admin group
            await this.groupManager.addMemberToGroup('subscription_admin', adminCredentials.email);

            console.log(`     ✅ Subscription admin user created for ${aiName}`);
            console.log(`     📧 Email: ${adminCredentials.email}`);
            console.log(`     🔑 Password: ${adminCredentials.password}`);

        } catch (error) {
            console.error(`     ❌ Failed to create subscription admin user for ${aiName}:`, error);
            // Don't throw - this is not critical for system startup
        }
    }

    /**
     * Create system user (bypassing normal validation)
     * @param {Object} userData - User data
     * @returns {Promise<void>}
     */
    async createSystemUser(userData) {
        try {
            // Use the sender directly to create user
            const result = await this.authManager.sender.createUser(null, userData);

            if (!result) {
                throw new Error('Failed to create system user');
            }

        } catch (error) {
            // Try alternative method using SNL directly
            const AuthSNL = require('../snl/auth_snl');
            const authSNL = new AuthSNL();

            const createUserSNL = authSNL.generateCreateUserSNL(userData);
            await this.authManager.sender.executeSNL(createUserSNL);
        }
    }

    /**
     * Verify security initialization
     * @param {string} aiName - AI name
     * @returns {Promise<Object>} Verification result
     */
    async verifySecurity(aiName) {
        try {
            console.log(`   🔍 Verifying security for AI: ${aiName}`);

            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            const aiUrl = keysVO.getAIUrl(aiName);
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiUrl || !aiToken) {
                return {
                    success: false,
                    error: 'Missing AI configuration'
                };
            }

            // Create and initialize AI sender
            const aiSender = new AISender();
            aiSender.initialize(aiUrl, aiToken);

            // Initialize managers
            this.authManager.initialize(aiSender);
            this.groupManager.initialize(aiSender);

            // Check groups
            const groups = await this.groupManager.listGroups(true);
            const expectedGroups = ['subscription_admin', 'admin', 'default'];
            const foundGroups = groups.map(g => g.name);
            const missingGroups = expectedGroups.filter(g => !foundGroups.includes(g));

            // Check subscription admin user
            const adminCredentials = this.groupSNL.getDefaultSubscriptionAdminCredentials();
            const adminUser = await this.authManager.getUser(adminCredentials.email);

            return {
                success: missingGroups.length === 0 && !!adminUser,
                groups: {
                    found: foundGroups,
                    missing: missingGroups,
                    total: groups.length
                },
                subscriptionAdmin: {
                    exists: !!adminUser,
                    email: adminCredentials.email
                }
            };

        } catch (error) {
            console.error(`   ❌ Security verification failed for AI ${aiName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reset security (for development/testing)
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async resetSecurity(aiName) {
        try {
            console.log(`   🔄 Resetting security for AI: ${aiName}`);

            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            const aiUrl = keysVO.getAIUrl(aiName);
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiUrl || !aiToken) {
                throw new Error('Missing AI configuration');
            }

            // Create and initialize AI sender
            const aiSender = new AISender();
            aiSender.initialize(aiUrl, aiToken);

            // Initialize managers
            this.authManager.initialize(aiSender);
            this.groupManager.initialize(aiSender);

            // Remove subscription admin user
            const adminCredentials = this.groupSNL.getDefaultSubscriptionAdminCredentials();
            try {
                const AuthSNL = require('../snl/auth_snl');
                const authSNL = new AuthSNL();
                const deleteUserSNL = authSNL.generateDeleteUserSNL(adminCredentials.email);
                await aiSender.executeSNL(deleteUserSNL);
            } catch (error) {
                // Ignore if user doesn't exist
            }

            // Remove non-system groups (keep system groups for re-initialization)
            const groups = await this.groupManager.listGroups(true);
            for (const group of groups) {
                if (!group.isSystem) {
                    try {
                        await this.groupManager.deleteGroup(group.name);
                    } catch (error) {
                        // Ignore deletion errors
                    }
                }
            }

            console.log(`   ✅ Security reset completed for AI: ${aiName}`);

        } catch (error) {
            console.error(`   ❌ Failed to reset security for AI ${aiName}:`, error);
            throw error;
        }
    }
}

module.exports = SecurityInitializer;