// src/data/initializer/database_initializer.js

const { getInstance } = require('../manager/keys_vo_manager');
const UserGroupManager = require('../manager/user_group_manager');
const AISender = require('../neuron_db/ai_sender');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * DatabaseInitializer - Initialize required databases and structures
 */
class DatabaseInitializer {
    constructor() {
        this.sender = new NeuronDBSender();
        this.aiSender = new AISender();
    }

    /**
     * Initialize all required databases and structures
     * @returns {Promise<void>}
     */
    async initializeAll() {
        try {
            console.log('🚀 Starting database initialization...');

            // Get KeysVO instance
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            // Initialize for each AI instance
            for (const aiName of keysVO.getAINames()) {
                console.log(`📦 Initializing databases for AI: ${aiName}`);
                await this.initializeAI(aiName, keysVO);
            }

            console.log('✅ Database initialization completed successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize databases for specific AI
     * @param {string} aiName - AI name
     * @param {KeysVO} keysVO - KeysVO instance
     * @returns {Promise<void>}
     */
    async initializeAI(aiName, keysVO) {
        try {
            const aiToken = keysVO.getAIToken(aiName);

            // 1. Initialize core databases
            await this.initializeCoreDatabases(aiToken);

            // 2. Initialize support databases
            await this.initializeSupportDatabases(aiToken);

            // 3. Initialize security structures
            await this.initializeSecurityStructures(aiName, aiToken);

            console.log(`✅ AI ${aiName} initialized successfully`);
        } catch (error) {
            console.error(`❌ Failed to initialize AI ${aiName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize core databases required by the system
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeCoreDatabases(aiToken) {
        try {
            console.log('   📊 Creating core databases...');

            const databases = [
                'main',      // Main database for core entities
                'workflow',  // Workflow definitions and executions
                'timeline',  // User timeline and audit trail
                'user-data'  // User personal data storage
            ];

            for (const dbName of databases) {
                try {
                    await this.createDatabaseIfNotExists(aiToken, dbName);
                    console.log(`     ✓ Database ${dbName} ready`);
                } catch (error) {
                    // Database might already exist, which is fine
                    if (!error.message.includes('already exists')) {
                        console.warn(`     ⚠ Warning creating database ${dbName}: ${error.message}`);
                    } else {
                        console.log(`     ✓ Database ${dbName} already exists`);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to initialize core databases:', error);
            throw error;
        }
    }

    /**
     * Initialize support databases (as specified in requirements)
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeSupportDatabases(aiToken) {
        try {
            console.log('   🔧 Creating support databases...');

            const supportDatabases = [
                'workflow-ris',  // Workflow RIS database
                'config-app',    // Application configuration
                'temp-storage'   // Temporary storage for workflows
            ];

            for (const dbName of supportDatabases) {
                try {
                    await this.createDatabaseIfNotExists(aiToken, dbName);
                    console.log(`     ✓ Support database ${dbName} ready`);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        console.warn(`     ⚠ Warning creating support database ${dbName}: ${error.message}`);
                    } else {
                        console.log(`     ✓ Support database ${dbName} already exists`);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to initialize support databases:', error);
            throw error;
        }
    }

    /**
     * Initialize security structures and default groups
     * @param {string} aiName - AI name
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeSecurityStructures(aiName, aiToken) {
        try {
            console.log('   🔐 Initializing security structures...');

            // Initialize user groups
            const userGroupManager = new UserGroupManager(aiToken);
            await userGroupManager.initialize();

            // Create default groups
            await userGroupManager.createDefaultGroups(aiName);

            // Create default subscription admin user
            await this.createDefaultSubscriptionAdminUser(aiName, aiToken);

            console.log('     ✓ Security structures initialized');
        } catch (error) {
            console.error('Failed to initialize security structures:', error);
            throw error;
        }
    }

    /**
     * Create default subscription admin user
     * @param {string} aiName - AI name
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async createDefaultSubscriptionAdminUser(aiName, aiToken) {
        try {
            const defaultCredentials = {
                username: 'subscription_admin',
                password: 'sudo_subscription_admin',
                email: 'subscription_admin@system.local'
            };

            // Check if subscription_admin user already exists
            try {
                // Try to login with existing credentials
                await this.aiSender.login(aiToken, defaultCredentials.username, defaultCredentials.password);
                console.log(`     ✓ Subscription admin user already exists for AI: ${aiName}`);
                return;
            } catch (error) {
                // User doesn't exist or credentials are wrong, create new user
            }

            // Create subscription admin user
            try {
                await this.aiSender.createUser(
                    aiToken,
                    defaultCredentials.username,
                    defaultCredentials.password,
                    defaultCredentials.email,
                    ['subscription_admin']
                );
                console.log(`     ✓ Subscription admin user created for AI: ${aiName}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`     ✓ Subscription admin user already exists for AI: ${aiName}`);
                } else {
                    console.warn(`     ⚠ Warning creating subscription admin user: ${error.message}`);
                }
            }
        } catch (error) {
            console.error('Failed to create default subscription admin user:', error);
            throw error;
        }
    }

    /**
     * Create database if it doesn't exist
     * @param {string} aiToken - AI token
     * @param {string} databaseName - Database name
     * @returns {Promise<void>}
     */
    async createDatabaseIfNotExists(aiToken, databaseName) {
        try {
            // List existing databases
            const databases = await this.aiSender.listDatabases(aiToken);

            // Check if database already exists
            if (databases.includes(databaseName)) {
                return; // Database already exists
            }

            // Create database
            await this.aiSender.createDatabase(aiToken, databaseName);
        } catch (error) {
            // If error is about database already existing, that's fine
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                return;
            }
            throw error;
        }
    }

    /**
     * Initialize main core entities
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeMainCoreEntities(aiToken) {
        try {
            console.log('   🏗 Creating main core entities...');

            const entities = [
                'plans',         // Subscription plans
                'subscriptions', // User subscriptions
                'planlimits',    // Plan limitations
                'usersplans',    // User-plan relationships
                'userroles'      // User roles
            ];

            // Create each entity in main.core namespace
            for (const entityName of entities) {
                try {
                    const createEntitySNL = `set(structure)\nvalues("${entityName}", {})\non(main.core.${entityName})`;
                    await this.aiSender.executeSNL(createEntitySNL, aiToken);
                    console.log(`     ✓ Entity ${entityName} ready`);
                } catch (error) {
                    // Entity might already exist
                    console.log(`     ✓ Entity ${entityName} already exists`);
                }
            }
        } catch (error) {
            console.error('Failed to initialize main core entities:', error);
            throw error;
        }
    }

    /**
     * Verify initialization
     * @param {string} aiName - AI name
     * @param {string} aiToken - AI token
     * @returns {Promise<boolean>}
     */
    async verifyInitialization(aiName, aiToken) {
        try {
            console.log(`   🔍 Verifying initialization for AI: ${aiName}...`);

            // Check if main databases exist
            const databases = await this.aiSender.listDatabases(aiToken);
            const requiredDbs = ['main', 'workflow', 'timeline', 'user-data'];

            for (const db of requiredDbs) {
                if (!databases.includes(db)) {
                    console.error(`   ❌ Database ${db} not found`);
                    return false;
                }
            }

            // Check if user groups structure exists
            const checkGroupsSNL = 'list(structure)\nvalues("usergroups")\non(main.core)';
            const groupsResponse = await this.aiSender.executeSNL(checkGroupsSNL, aiToken);

            if (!groupsResponse || !groupsResponse.usergroups) {
                console.error('   ❌ User groups structure not found');
                return false;
            }

            console.log(`   ✅ Initialization verified for AI: ${aiName}`);
            return true;
        } catch (error) {
            console.error(`Failed to verify initialization for AI ${aiName}:`, error);
            return false;
        }
    }
}

// Export both class and convenience function
module.exports = DatabaseInitializer;

// Convenience function for npm script
module.exports.initializeAll = async function() {
    const initializer = new DatabaseInitializer();
    await initializer.initializeAll();
};