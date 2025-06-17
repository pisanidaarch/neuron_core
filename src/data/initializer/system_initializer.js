// src/data/initializer/system_initializer.js

const config = require('../../../config.json');
const NeuronDBSender = require('../neuron_db/sender');
const AISender = require('../neuron_db/ai_sender');
const UserManager = require('../manager/user_manager');
const GroupManager = require('../manager/group_manager');
const User = require('../../cross/entity/user');
const Group = require('../../cross/entity/group');

/**
 * System Initializer - Initializes the system with default data
 */
class SystemInitializer {
    constructor() {
        this.configSender = new NeuronDBSender();
        this.initialized = false;
    }

    /**
     * Initialize system
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️  System already initialized');
            return;
        }

        console.log('🔧 Starting system initialization...');

        try {
            // Check health of config database
            await this.checkConfigHealth();

            // Initialize each AI instance
            const aiInstances = Object.keys(config.ai_instances || {});
            for (const aiName of aiInstances) {
                await this.initializeAIInstance(aiName);
            }

            this.initialized = true;
            console.log('✅ System initialization completed successfully');

        } catch (error) {
            console.error('❌ System initialization failed:', error);
            throw error;
        }
    }

    /**
     * Check config database health
     */
    async checkConfigHealth() {
        console.log('🏥 Checking config database health...');

        const health = await this.configSender.healthCheck();

        if (!health || !health.healthy) {
            throw new Error('Config database is not healthy');
        }

        console.log('✅ Config database is healthy');
    }

    /**
     * Initialize AI instance
     */
    async initializeAIInstance(aiName) {
        console.log(`🤖 Initializing AI instance: ${aiName}`);

        try {
            const aiSender = new AISender(aiName);

            // Check AI health
            const health = await aiSender.healthCheck();
            if (!health || !health.healthy) {
                console.error(`❌ AI instance ${aiName} is not healthy`);
                return;
            }

            // Initialize managers
            const userManager = new UserManager();
            userManager.initialize(aiSender);

            const groupManager = new GroupManager();
            groupManager.initialize(aiSender);

            // Get AI token
            const aiToken = config.ai_instances[aiName].token;

            // Initialize default groups
            await this.initializeDefaultGroups(groupManager, aiToken);

            // Initialize default users
            await this.initializeDefaultUsers(userManager, aiToken);

            console.log(`✅ AI instance ${aiName} initialized successfully`);

        } catch (error) {
            console.error(`❌ Failed to initialize AI instance ${aiName}:`, error);
            // Continue with other instances
        }
    }

    /**
     * Initialize default groups
     */
    async initializeDefaultGroups(groupManager, token) {
        console.log('👥 Initializing default groups...');

        const defaultGroups = [
            {
                name: 'subscription_admin',
                description: 'Subscription administrators with full system access',
                permissions: ['subscription_management', 'user_management', 'system_config'],
                system: true
            },
            {
                name: 'admin',
                description: 'System administrators',
                permissions: ['user_management', 'config_management'],
                system: true
            },
            {
                name: 'default',
                description: 'Default user group',
                permissions: ['basic_access'],
                system: false
            }
        ];

        for (const groupData of defaultGroups) {
            try {
                // Check if group exists
                const exists = await groupManager.groupExists(groupData.name, token);

                if (!exists) {
                    const group = new Group(groupData);
                    await groupManager.createGroup(group, token);
                    console.log(`✅ Created group: ${groupData.name}`);
                } else {
                    console.log(`⏭️  Group already exists: ${groupData.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create group ${groupData.name}:`, error.message);
            }
        }
    }

    /**
     * Initialize default users
     */
    async initializeDefaultUsers(userManager, token) {
        console.log('👤 Initializing default users...');

        // Default subscription admin user
        const defaultUsers = [
            {
                email: 'subscription_admin@system.local',
                nick: 'Subscription Admin',
                password: 'sudo_subscription_admin',
                group: 'subscription_admin',
                active: true,
                metadata: {
                    system: true,
                    description: 'Default subscription administrator'
                }
            }
        ];

        for (const userData of defaultUsers) {
            try {
                // Check if user exists
                const exists = await userManager.userExists(userData.email, token);

                if (!exists) {
                    const user = new User(userData);
                    await userManager.createUser(user, token);
                    console.log(`✅ Created user: ${userData.email}`);
                } else {
                    console.log(`⏭️  User already exists: ${userData.email}`);
                }
            } catch (error) {
                console.error(`❌ Failed to create user ${userData.email}:`, error.message);
            }
        }
    }

    /**
     * Initialize database structure
     */
    async initializeDatabaseStructure(sender, token) {
        console.log('🗄️  Checking database structure...');

        // Core namespaces that should exist
        const coreNamespaces = ['core', 'config', 'keys'];

        for (const namespace of coreNamespaces) {
            try {
                // Check if namespace exists in main database
                const checkSNL = `list(structure)\nvalues("*")\non(main.${namespace})`;
                await sender.executeSNL(checkSNL, token);
                console.log(`✅ Namespace exists: main.${namespace}`);
            } catch (error) {
                console.log(`⚠️  Namespace check failed for main.${namespace}: ${error.message}`);
                // Namespace creation would be done via API, not SNL
            }
        }
    }

    /**
     * Reset system (for development)
     */
    async reset() {
        console.log('🔄 Resetting system...');
        this.initialized = false;

        // In production, this would require additional safety checks
        if (process.env.NODE_ENV === 'production') {
            throw new Error('System reset not allowed in production');
        }

        console.log('✅ System reset complete');
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            timestamp: new Date().toISOString(),
            configUrl: config.database.config_url,
            aiInstances: Object.keys(config.ai_instances || {})
        };
    }
}

module.exports = SystemInitializer;