// src/data/initializer/database_initializer.js

const { getInstance } = require('../manager/keys_vo_manager');
const NeuronDBSender = require('../neuron_db/sender');
const { DatabaseError } = require('../../cross/entity/errors');

/**
 * DatabaseInitializer - Initialize and manage database connections
 */
class DatabaseInitializer {
    constructor() {
        this.initialized = false;
        this.configSender = null;
        this.aiSenders = new Map();
    }

    /**
     * Initialize all databases
     * @returns {Promise<void>}
     */
    async initializeAll() {
        try {
            console.log('🗄️  Initializing databases...');

            // Get KeysVO instance
            const keysManager = getInstance();
            const keysVO = keysManager.getKeysVO();

            if (!keysVO) {
                throw new DatabaseError('KeysVO not initialized');
            }

            // Initialize config database
            await this.initializeConfigDatabase(keysVO);

            // Initialize AI instance databases
            await this.initializeAIDatabases(keysVO);

            // Test connections
            await this.testConnections();

            this.initialized = true;
            console.log('✅ All databases initialized successfully');

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw new DatabaseError(`Database initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize config database
     * @param {KeysVO} keysVO - Keys value object
     * @private
     */
    async initializeConfigDatabase(keysVO) {
        const configUrl = keysVO.getConfigUrl();
        const configToken = keysVO.getConfigToken();

        if (!configUrl || !configToken) {
            throw new DatabaseError('Config database credentials not found');
        }

        console.log('   📡 Initializing config database...');

        this.configSender = new NeuronDBSender();
        this.configSender.initialize(configUrl, configToken);

        // Test config database connection
        try {
            await this.configSender.testConnection();
            console.log('   ✅ Config database connected');
        } catch (error) {
            throw new DatabaseError(`Config database connection failed: ${error.message}`);
        }
    }

    /**
     * Initialize AI instance databases
     * @param {KeysVO} keysVO - Keys value object
     * @private
     */
    async initializeAIDatabases(keysVO) {
        const aiNames = keysVO.getAINames();

        console.log(`   🤖 Initializing ${aiNames.length} AI databases...`);

        for (const aiName of aiNames) {
            try {
                const aiUrl = keysVO.getAIUrl(aiName);
                const aiToken = keysVO.getAIToken(aiName);

                if (!aiUrl || !aiToken) {
                    console.warn(`   ⚠️  Skipping AI ${aiName}: missing credentials`);
                    continue;
                }

                const aiSender = new NeuronDBSender();
                aiSender.initialize(aiUrl, aiToken);

                // Test AI database connection
                await aiSender.testConnection();

                this.aiSenders.set(aiName, aiSender);
                console.log(`   ✅ AI database connected: ${aiName}`);

            } catch (error) {
                console.warn(`   ⚠️  AI database connection failed for ${aiName}: ${error.message}`);
                // Don't throw error for individual AI instances
            }
        }
    }

    /**
     * Test all database connections
     * @private
     */
    async testConnections() {
        console.log('   🔍 Testing database connections...');

        // Test config database
        if (this.configSender) {
            try {
                await this.configSender.testConnection();
                console.log('   ✅ Config database: OK');
            } catch (error) {
                throw new DatabaseError(`Config database test failed: ${error.message}`);
            }
        }

        // Test AI databases
        for (const [aiName, sender] of this.aiSenders) {
            try {
                await sender.testConnection();
                console.log(`   ✅ AI database ${aiName}: OK`);
            } catch (error) {
                console.warn(`   ⚠️  AI database ${aiName}: ${error.message}`);
            }
        }
    }

    /**
     * Get config database sender
     * @returns {NeuronDBSender|null}
     */
    getConfigSender() {
        return this.configSender;
    }

    /**
     * Get AI database sender
     * @param {string} aiName - AI instance name
     * @returns {NeuronDBSender|null}
     */
    getAISender(aiName) {
        return this.aiSenders.get(aiName);
    }

    /**
     * Get all AI sender names
     * @returns {Array<string>}
     */
    getAISenderNames() {
        return Array.from(this.aiSenders.keys());
    }

    /**
     * Check if initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get initialization status
     * @returns {Object}
     */
    async getStatus() {
        try {
            const status = {
                initialized: this.initialized,
                configDatabase: {
                    connected: false,
                    error: null
                },
                aiDatabases: {}
            };

            // Check config database
            if (this.configSender) {
                try {
                    await this.configSender.testConnection();
                    status.configDatabase.connected = true;
                } catch (error) {
                    status.configDatabase.error = error.message;
                }
            }

            // Check AI databases
            for (const [aiName, sender] of this.aiSenders) {
                try {
                    await sender.testConnection();
                    status.aiDatabases[aiName] = {
                        connected: true,
                        error: null
                    };
                } catch (error) {
                    status.aiDatabases[aiName] = {
                        connected: false,
                        error: error.message
                    };
                }
            }

            return status;

        } catch (error) {
            throw new DatabaseError(`Failed to get database status: ${error.message}`);
        }
    }

    /**
     * Reinitialize all databases
     * @returns {Promise<void>}
     */
    async reinitializeAll() {
        try {
            console.log('🔄 Reinitializing all databases...');
            this.initialized = false;
            this.configSender = null;
            this.aiSenders.clear();

            await this.initializeAll();
            console.log('✅ Database reinitialization completed');

        } catch (error) {
            console.error('❌ Database reinitialization failed:', error);
            throw new DatabaseError(`Database reinitialization failed: ${error.message}`);
        }
    }

    /**
     * Close all connections
     */
    async close() {
        console.log('📴 Closing database connections...');

        // Close config sender
        if (this.configSender && typeof this.configSender.close === 'function') {
            await this.configSender.close();
        }

        // Close AI senders
        for (const [aiName, sender] of this.aiSenders) {
            if (typeof sender.close === 'function') {
                await sender.close();
            }
        }

        this.initialized = false;
        this.configSender = null;
        this.aiSenders.clear();

        console.log('✅ All database connections closed');
    }
}

module.exports = DatabaseInitializer;