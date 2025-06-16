// src/data/initializer/database_initializer.js

const { getInstance } = require('../manager/keys_vo_manager');
const UserManager = require('../manager/user_manager');
const UserGroupManager = require('../manager/user_group_manager');
const SubscriptionManager = require('../manager/subscription_manager');
const PlanManager = require('../manager/plan_manager');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * Database Initializer for NeuronCore
 * Creates required databases and initial data
 */
class DatabaseInitializer {
    constructor() {
        this.sender = new NeuronDBSender();
        this.requiredDatabases = [
            'timeline',      // Timeline data
            'user-data',     // User personal data
            'workflow',      // Active workflows
            'workflow-hist', // Workflow history
            'schedule'       // Scheduled tasks
        ];
    }

    /**
     * Initialize all databases and structures for all AIs
     * @returns {Promise<void>}
     */
    async initializeAll() {
        try {
            console.log('🔧 Initializing NeuronCore databases...');

            // Get all AI configurations
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();
            const aiNames = keysVO.getAINames();

            console.log(`Found ${aiNames.length} AI instances to initialize`);

            // Initialize each AI
            for (const aiName of aiNames) {
                try {
                    console.log(`\n📊 Initializing databases for AI: ${aiName}`);
                    await this.initializeAI(aiName);
                    console.log(`✅ AI ${aiName} initialized successfully`);
                } catch (error) {
                    console.error(`❌ Failed to initialize AI ${aiName}:`, error.message);
                    // Continue with other AIs
                }
            }

            console.log('\n✨ Database initialization completed');

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize databases for specific AI
     * @param {string} aiName - AI name
     * @returns {Promise<void>}
     */
    async initializeAI(aiName) {
        const keysManager = getInstance();
        const keysVO = await keysManager.getKeysVO();
        const aiToken = keysVO.getAIToken(aiName);

        if (!aiToken) {
            throw new Error(`No token found for AI: ${aiName}`);
        }

        // 1. Create required databases
        await this.createRequiredDatabases(aiToken);

        // 2. Initialize main database structures
        await this.initializeMainDatabase(aiToken);

        // 3. Create subscription admin user
        await this.createSubscriptionAdminUser(aiToken);

        // 4. Initialize workflow databases
        await this.initializeWorkflowDatabases(aiToken);

        // 5. Initialize timeline and user-data databases
        await this.initializeUserDatabases(aiToken);
    }

    /**
     * Create required databases
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async createRequiredDatabases(aiToken) {
        console.log('   📁 Creating required databases...');

        for (const dbName of this.requiredDatabases) {
            try {
                // Check if database exists
                const existingDbs = await this.sender.listDatabases(aiToken);
                const dbExists = existingDbs.some(db => db.name === dbName);

                if (!dbExists) {
                    await this.sender.createDatabase(aiToken, dbName);
                    console.log(`      ✅ Created database: ${dbName}`);
                } else {
                    console.log(`      ⚡ Database already exists: ${dbName}`);
                }
            } catch (error) {
                console.error(`      ❌ Failed to create database ${dbName}:`, error.message);
            }
        }
    }

    /**
     * Initialize main database structures
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeMainDatabase(aiToken) {
        console.log('   🏗️  Initializing main database structures...');

        try {
            // Initialize managers
            const userManager = new UserManager(aiToken);
            const userGroupManager = new UserGroupManager(aiToken);
            const subscriptionManager = new SubscriptionManager(aiToken);
            const planManager = new PlanManager(aiToken);

            // Initialize each manager (creates structures if needed)
            await userManager.initialize();
            await userGroupManager.initialize();
            await subscriptionManager.initialize();
            await planManager.initialize();

            console.log('      ✅ Main database structures initialized');

        } catch (error) {
            console.error('      ❌ Failed to initialize main database:', error.message);
            throw error;
        }
    }

    /**
     * Create subscription admin user
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async createSubscriptionAdminUser(aiToken) {
        console.log('   👤 Creating subscription admin user...');

        try {
            const userManager = new UserManager(aiToken);
            const userGroupManager = new UserGroupManager(aiToken);

            // Create subscription admin user if not exists
            const adminUser = await userManager.createSubscriptionAdminUser();

            if (adminUser) {
                // Add to subscription_admin group
                await userGroupManager.addSubscriptionAdmin(adminUser.email);
                console.log('      ✅ Subscription admin user created and configured');
            } else {
                console.log('      ⚡ Subscription admin user already exists');
            }

        } catch (error) {
            console.error('      ❌ Failed to create subscription admin user:', error.message);
        }
    }

    /**
     * Initialize workflow databases
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeWorkflowDatabases(aiToken) {
        console.log('   🔄 Initializing workflow databases...');

        try {
            // Create core namespace in workflow database
            const workflowNamespaces = await this.sender.listNamespaces(aiToken, 'workflow');
            if (!workflowNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'workflow', 'core');
                console.log('      ✅ Created workflow.core namespace');
            }

            // Create core namespace in workflow-hist database
            const workflowHistNamespaces = await this.sender.listNamespaces(aiToken, 'workflow-hist');
            if (!workflowHistNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'workflow-hist', 'core');
                console.log('      ✅ Created workflow-hist.core namespace');
            }

            // Initialize schedule structure in main database
            const scheduleCommand = 'set(structure)\nvalues("schedule", {})\non(main.core.schedule)';
            await this.sender.executeSNL(scheduleCommand, aiToken);
            console.log('      ✅ Initialized schedule structure');

        } catch (error) {
            console.error('      ❌ Failed to initialize workflow databases:', error.message);
        }
    }

    /**
     * Initialize timeline and user-data databases
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeUserDatabases(aiToken) {
        console.log('   📚 Initializing user databases...');

        try {
            // Timeline database - create core namespace
            const timelineNamespaces = await this.sender.listNamespaces(aiToken, 'timeline');
            if (!timelineNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'timeline', 'core');
                console.log('      ✅ Created timeline.core namespace');
            }

            // User-data database - create core namespace
            const userDataNamespaces = await this.sender.listNamespaces(aiToken, 'user-data');
            if (!userDataNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'user-data', 'core');
                console.log('      ✅ Created user-data.core namespace');
            }

        } catch (error) {
            console.error('      ❌ Failed to initialize user databases:', error.message);
        }
    }

    /**
     * Set default permissions for databases
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async setDefaultPermissions(aiToken) {
        console.log('   🔐 Setting default permissions...');

        try {
            const permissions = [
                { database: 'timeline', level: 1 },
                { database: 'user-data', level: 2 },
                { database: 'workflow', level: 1 },
                { database: 'workflow-hist', level: 1 }
            ];

            // Set permissions for subscription admin
            for (const perm of permissions) {
                try {
                    await this.sender.setPermission(
                        aiToken,
                        'subscription_admin@system.local',
                        perm.database,
                        3 // Admin level
                    );
                } catch (error) {
                    console.error(`      ⚠️  Failed to set permission for ${perm.database}:`, error.message);
                }
            }

            console.log('      ✅ Default permissions configured');

        } catch (error) {
            console.error('      ❌ Failed to set default permissions:', error.message);
        }
    }

    /**
     * Verify initialization
     * @param {string} aiName - AI name
     * @returns {Promise<Object>}
     */
    async verifyInitialization(aiName) {
        try {
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();
            const aiToken = keysVO.getAIToken(aiName);

            const results = {
                aiName,
                databases: {},
                structures: {},
                users: {}
            };

            // Check databases
            const databases = await this.sender.listDatabases(aiToken);
            for (const dbName of this.requiredDatabases) {
                results.databases[dbName] = databases.some(db => db.name === dbName);
            }

            // Check main structures
            try {
                const userCommand = 'list(structure)\nvalues("users")\non(main.core)';
                const userResponse = await this.sender.executeSNL(userCommand, aiToken);
                results.structures.users = Array.isArray(userResponse) && userResponse.includes('users');
            } catch (error) {
                results.structures.users = false;
            }

            // Check subscription admin user
            try {
                const userManager = new UserManager(aiToken);
                const adminUser = await userManager.getUser('subscription_admin@system.local');
                results.users.subscription_admin = adminUser !== null;
            } catch (error) {
                results.users.subscription_admin = false;
            }

            return results;

        } catch (error) {
            console.error('Failed to verify initialization:', error);
            return { error: error.message };
        }
    }
}

module.exports = DatabaseInitializer;