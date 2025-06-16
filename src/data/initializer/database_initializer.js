// src/data/initializer/database_initializer.js

const UserManager = require('../manager/user_manager');
const UserGroupManager = require('../manager/user_group_manager');
const SubscriptionManager = require('../manager/subscription_manager');
const PlanManager = require('../manager/plan_manager');
const ConfigManager = require('../manager/config_manager');
const ConfigSender = require('../neuron_db/config_sender');
const AISender = require('../neuron_db/ai_sender');

/**
 * DatabaseInitializer - Handles database and structure initialization
 */
class DatabaseInitializer {
    constructor() {
        this.sender = null;
        this.requiredDatabases = [
            'main',
            'timeline',
            'user-data',
            'workflow',
            'workflow-hist',
            'config-db'
        ];
    }

    /**
     * Initialize with sender
     * @param {Object} sender - Database sender
     */
    initialize(sender) {
        this.sender = sender;
    }

    /**
     * Run complete initialization process
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async runInitialization(aiToken) {
        console.log('🚀 Starting NeuronCore database initialization...');

        try {
            // 1. Create required databases
            await this.createRequiredDatabases(aiToken);

            // 2. Initialize main database structures
            await this.initializeMainDatabase(aiToken);

            // 3. Initialize config database
            await this.initializeConfigDatabase(aiToken);

            // 4. Create default groups
            await this.createDefaultGroups(aiToken);

            // 5. Create subscription admin user
            await this.createSubscriptionAdminUser(aiToken);

            // 6. Initialize workflow databases
            await this.initializeWorkflowDatabases(aiToken);

            // 7. Initialize timeline and user-data databases
            await this.initializeUserDatabases(aiToken);

            // 8. Set default permissions
            await this.setDefaultPermissions(aiToken);

            // 9. Create default plans
            await this.createDefaultPlans(aiToken);

            console.log('✅ Database initialization completed successfully!');

        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            throw error;
        }
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
            // Create core namespace if it doesn't exist
            const mainNamespaces = await this.sender.listNamespaces(aiToken, 'main');
            if (!mainNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'main', 'core');
                console.log('      ✅ Created main.core namespace');
            }

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
     * Initialize config database
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async initializeConfigDatabase(aiToken) {
        console.log('   ⚙️  Initializing config database...');

        try {
            // Create core namespace in config database
            const configNamespaces = await this.sender.listNamespaces(aiToken, 'config-db');
            if (!configNamespaces.some(ns => ns.name === 'core')) {
                await this.sender.createNamespace(aiToken, 'config-db', 'core');
                console.log('      ✅ Created config-db.core namespace');
            }

            console.log('      ✅ Config database initialized');

        } catch (error) {
            console.error('      ❌ Failed to initialize config database:', error.message);
        }
    }

    /**
     * Create default groups
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async createDefaultGroups(aiToken) {
        console.log('   👥 Creating default groups...');

        try {
            const userGroupManager = new UserGroupManager(aiToken);

            const defaultGroups = [
                {
                    name: 'subscription_admin',
                    description: 'System group for payment gateway integration',
                    hidden: true,
                    system_group: true
                },
                {
                    name: 'admin',
                    description: 'AI administrators who can manage users and settings',
                    hidden: false,
                    system_group: true
                },
                {
                    name: 'default',
                    description: 'Default group for regular AI users',
                    hidden: false,
                    system_group: true
                }
            ];

            for (const groupData of defaultGroups) {
                const existingGroup = await userGroupManager.getGroup(groupData.name);
                if (!existingGroup) {
                    await userGroupManager.createGroup(
                        groupData.name,
                        groupData.description,
                        groupData.hidden,
                        groupData.system_group
                    );
                    console.log(`      ✅ Created group: ${groupData.name}`);
                } else {
                    console.log(`      ⚡ Group already exists: ${groupData.name}`);
                }
            }

        } catch (error) {
            console.error('      ❌ Failed to create default groups:', error.message);
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
                { database: 'workflow-hist', level: 1 },
                { database: 'config-db', level: 3 }
            ];

            // Set permissions for subscription admin
            for (const perm of permissions) {
                try {
                    await this.sender.setPermission(
                        aiToken,
                        'subscription_admin@system.local',
                        perm.database,
                        3 // Admin level for all databases
                    );
                } catch (error) {
                    // Permission may already exist, continue
                    console.warn(`      ⚠️ Could not set ${perm.database} permission:`, error.message);
                }
            }

            console.log('      ✅ Default permissions configured');

        } catch (error) {
            console.error('      ❌ Failed to set default permissions:', error.message);
        }
    }

    /**
     * Create default plans
     * @param {string} aiToken - AI token
     * @returns {Promise<void>}
     */
    async createDefaultPlans(aiToken) {
        console.log('   💰 Creating default plans...');

        try {
            const planManager = new PlanManager(aiToken);

            const defaultPlans = [
                {
                    id: 'basic',
                    name: 'Basic Plan',
                    description: 'Basic features for individual users',
                    price: 29.90,
                    billing_cycle: 'monthly',
                    features: ['Timeline access', 'Basic chat', 'Limited workflows'],
                    limits: {
                        max_users: 1,
                        max_workflows: 10,
                        max_timeline_entries: 1000
                    },
                    active: true
                },
                {
                    id: 'premium',
                    name: 'Premium Plan',
                    description: 'Advanced features for power users',
                    price: 59.90,
                    billing_cycle: 'monthly',
                    features: ['Full timeline access', 'Advanced chat', 'Unlimited workflows', 'Custom commands'],
                    limits: {
                        max_users: 5,
                        max_workflows: 100,
                        max_timeline_entries: 10000
                    },
                    active: true
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise Plan',
                    description: 'Full features for organizations',
                    price: 199.90,
                    billing_cycle: 'monthly',
                    features: ['All features', 'Priority support', 'Custom integrations', 'Advanced analytics'],
                    limits: {
                        max_users: 50,
                        max_workflows: -1, // unlimited
                        max_timeline_entries: -1 // unlimited
                    },
                    active: true
                }
            ];

            for (const planData of defaultPlans) {
                const existingPlan = await planManager.getPlan(planData.id);
                if (!existingPlan) {
                    await planManager.createPlan(planData);
                    console.log(`      ✅ Created plan: ${planData.name}`);
                } else {
                    console.log(`      ⚡ Plan already exists: ${planData.name}`);
                }
            }

        } catch (error) {
            console.error('      ❌ Failed to create default plans:', error.message);
        }
    }

    /**
     * Get initialization status
     * @param {string} aiToken - AI token
     * @returns {Promise<Object>}
     */
    async getInitializationStatus(aiToken) {
        const status = {
            databases: {},
            structures: {},
            users: {},
            groups: {},
            plans: {}
        };

        try {
            // Check databases
            const databases = await this.sender.listDatabases(aiToken);
            for (const dbName of this.requiredDatabases) {
                status.databases[dbName] = databases.some(db => db.name === dbName);
            }

            // Check structures (basic check)
            const userManager = new UserManager(aiToken);
            const userGroupManager = new UserGroupManager(aiToken);
            const subscriptionManager = new SubscriptionManager(aiToken);
            const planManager = new PlanManager(aiToken);

            // Initialize managers
            await userManager.initialize();
            await userGroupManager.initialize();
            await subscriptionManager.initialize();
            await planManager.initialize();

            // Check if subscription admin exists
            const subscriptionAdmin = await userManager.getUser('subscription_admin@system.local');
            status.users.subscription_admin = subscriptionAdmin !== null;

            // Check default groups
            const defaultGroups = ['subscription_admin', 'admin', 'default'];
            for (const groupName of defaultGroups) {
                const group = await userGroupManager.getGroup(groupName);
                status.groups[groupName] = group !== null;
            }

            // Check default plans
            const defaultPlans = ['basic', 'premium', 'enterprise'];
            for (const planId of defaultPlans) {
                const plan = await planManager.getPlan(planId);
                status.plans[planId] = plan !== null;
            }

        } catch (error) {
            console.error('Error getting initialization status:', error);
        }

        return status;
    }
}

module.exports = DatabaseInitializer;