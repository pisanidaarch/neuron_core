// src/data/initializer/database_initializer.js

const { getInstance } = require('../manager/keys_vo_manager');
const AISender = require('../neuron_db/ai_sender');
const NeuronDBSender = require('../neuron_db/sender');

/**
 * DatabaseInitializer - Initialize required databases and structures
 */
class DatabaseInitializer {
    constructor() {
        this.sender = new NeuronDBSender();
        this.requiredDatabases = [
            'timeline',
            'user-data',
            'workflow',
            'workflow-hist'
        ];
    }

    /**
     * Initialize all required databases and structures
     * @returns {Promise<void>}
     */
    async initializeAll() {
        try {
            console.log('📦 Starting database initialization...');

            // Get KeysVO instance
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            // Initialize config sender
            this.sender.initialize(keysVO.getConfigUrl(), keysVO.getConfigToken());

            // Test connection first
            const isConnected = await this.sender.testConnection();
            if (!isConnected) {
                console.warn('   ⚠️  NeuronDB not reachable - skipping database initialization');
                return;
            }

            // Initialize for each AI instance
            for (const aiName of keysVO.getAINames()) {
                console.log(`   🔧 Initializing databases for AI: ${aiName}`);
                await this.initializeAI(aiName, keysVO);
            }

            console.log('✅ Database initialization completed successfully');

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            // Don't throw - this is not critical for application startup
            console.warn('⚠️  Continuing without database initialization');
        }
    }

    /**
     * Initialize databases for specific AI
     * @param {string} aiName - AI name
     * @param {Object} keysVO - KeysVO instance
     * @returns {Promise<void>}
     */
    async initializeAI(aiName, keysVO) {
        try {
            const aiUrl = keysVO.getAIUrl(aiName);
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiUrl || !aiToken) {
                console.warn(`     ⚠️  Skipping AI ${aiName}: missing URL or token`);
                return;
            }

            // Create AI sender
            const aiSender = new AISender();
            aiSender.initialize(aiUrl, aiToken);

            // Test AI connection
            const isAiConnected = await aiSender.testConnection();
            if (!isAiConnected) {
                console.warn(`     ⚠️  AI ${aiName} not reachable - skipping`);
                return;
            }

            // 1. Initialize core databases
            await this.initializeCoreDatabases(aiSender);

            // 2. Initialize support databases
            await this.initializeSupportDatabases(aiSender);

            // 3. Initialize workflow databases
            await this.initializeWorkflowDatabases(aiSender);

            console.log(`     ✅ Databases initialized for AI: ${aiName}`);

        } catch (error) {
            console.error(`     ❌ Failed to initialize databases for AI ${aiName}:`, error);
            // Don't throw - continue with other AIs
        }
    }

    /**
     * Initialize core databases
     * @param {AISender} aiSender - AI sender instance
     * @returns {Promise<void>}
     */
    async initializeCoreDatabases(aiSender) {
        try {
            console.log('       📚 Initializing core databases...');

            // Core databases are typically created by NeuronDB itself
            // We mainly need to ensure they exist and create core namespaces

            // Create core namespace if it doesn't exist
            await this._ensureNamespaceExists(aiSender, 'main', 'core');

            console.log('       ✅ Core databases initialized');

        } catch (error) {
            console.error('       ❌ Failed to initialize core databases:', error);
            throw error;
        }
    }

    /**
     * Initialize support databases
     * @param {AISender} aiSender - AI sender instance
     * @returns {Promise<void>}
     */
    async initializeSupportDatabases(aiSender) {
        try {
            console.log('       📋 Initializing support databases...');

            // Initialize timeline database
            await this._ensureDatabaseExists(aiSender, 'timeline');

            // Initialize user-data database
            await this._ensureDatabaseExists(aiSender, 'user-data');

            console.log('       ✅ Support databases initialized');

        } catch (error) {
            console.error('       ❌ Failed to initialize support databases:', error);
            throw error;
        }
    }

    /**
     * Initialize workflow databases
     * @param {AISender} aiSender - AI sender instance
     * @returns {Promise<void>}
     */
    async initializeWorkflowDatabases(aiSender) {
        try {
            console.log('       🔄 Initializing workflow databases...');

            // Initialize workflow database
            await this._ensureDatabaseExists(aiSender, 'workflow');

            // Initialize workflow history database
            await this._ensureDatabaseExists(aiSender, 'workflow-hist');

            console.log('       ✅ Workflow databases initialized');

        } catch (error) {
            console.error('       ❌ Failed to initialize workflow databases:', error);
            throw error;
        }
    }

    /**
     * Ensure database exists
     * @private
     */
    async _ensureDatabaseExists(aiSender, databaseName) {
        try {
            // Try to list databases to check if it exists
            const listSNL = `list(database)\nvalues("${databaseName}")\non()`;
            const result = await aiSender.executeSNL(listSNL);

            // If database doesn't exist in the list, create it
            if (!result || Object.keys(result).length === 0) {
                console.log(`         📝 Creating database: ${databaseName}`);
                await aiSender.createDatabase(databaseName);
                console.log(`         ✅ Database created: ${databaseName}`);
            } else {
                console.log(`         ✓ Database exists: ${databaseName}`);
            }

        } catch (error) {
            if (error.message && error.message.includes('not found')) {
                // Database doesn't exist, try to create it
                try {
                    console.log(`         📝 Creating database: ${databaseName}`);
                    await aiSender.createDatabase(databaseName);
                    console.log(`         ✅ Database created: ${databaseName}`);
                } catch (createError) {
                    console.error(`         ❌ Failed to create database ${databaseName}:`, createError.message);
                }
            } else {
                console.error(`         ❌ Error checking database ${databaseName}:`, error.message);
            }
        }
    }

    /**
     * Ensure namespace exists
     * @private
     */
    async _ensureNamespaceExists(aiSender, databaseName, namespaceName) {
        try {
            // Try to list namespaces to check if it exists
            const listSNL = `list(namespace)\nvalues("${namespaceName}")\non(${databaseName})`;
            const result = await aiSender.executeSNL(listSNL);

            // If namespace doesn't exist in the list, create it
            if (!result || Object.keys(result).length === 0) {
                console.log(`         📁 Creating namespace: ${databaseName}.${namespaceName}`);
                await aiSender.createNamespace(databaseName, namespaceName);
                console.log(`         ✅ Namespace created: ${databaseName}.${namespaceName}`);
            } else {
                console.log(`         ✓ Namespace exists: ${databaseName}.${namespaceName}`);
            }

        } catch (error) {
            if (error.message && error.message.includes('not found')) {
                // Namespace doesn't exist, try to create it
                try {
                    console.log(`         📁 Creating namespace: ${databaseName}.${namespaceName}`);
                    await aiSender.createNamespace(databaseName, namespaceName);
                    console.log(`         ✅ Namespace created: ${databaseName}.${namespaceName}`);
                } catch (createError) {
                    console.error(`         ❌ Failed to create namespace ${databaseName}.${namespaceName}:`, createError.message);
                }
            } else {
                console.error(`         ❌ Error checking namespace ${databaseName}.${namespaceName}:`, error.message);
            }
        }
    }

    /**
     * Initialize user-specific namespaces
     * @param {string} aiName - AI name
     * @param {string} userEmail - User email
     * @returns {Promise<void>}
     */
    async initializeUserNamespaces(aiName, userEmail) {
        try {
            console.log(`   👤 Initializing user namespaces for ${userEmail} in AI: ${aiName}`);

            // Get AI configuration
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            const aiUrl = keysVO.getAIUrl(aiName);
            const aiToken = keysVO.getAIToken(aiName);

            if (!aiUrl || !aiToken) {
                throw new Error(`AI ${aiName} not configured`);
            }

            // Create AI sender
            const aiSender = new AISender();
            aiSender.initialize(aiUrl, aiToken);

            // Generate namespace name from email
            const namespaceName = this._generateNamespaceFromEmail(userEmail);

            // Create user namespaces in support databases
            await this._ensureNamespaceExists(aiSender, 'timeline', namespaceName);
            await this._ensureNamespaceExists(aiSender, 'user-data', namespaceName);

            console.log(`   ✅ User namespaces initialized for ${userEmail}`);

        } catch (error) {
            console.error(`   ❌ Failed to initialize user namespaces for ${userEmail}:`, error);
            // Don't throw - this shouldn't block user operations
        }
    }

    /**
     * Generate namespace name from email
     * @private
     */
    _generateNamespaceFromEmail(email) {
        return email.replace('@', '_').replace(/\./g, '_').toLowerCase();
    }

    /**
     * Get database status
     * @returns {Promise<Object>} Database status
     */
    async getDatabaseStatus() {
        try {
            const keysManager = getInstance();
            const keysVO = await keysManager.getKeysVO();

            // Initialize config sender
            this.sender.initialize(keysVO.getConfigUrl(), keysVO.getConfigToken());

            const status = {
                connected: false,
                databases: {},
                aiInstances: {}
            };

            // Test config connection
            status.connected = await this.sender.testConnection();

            if (status.connected) {
                // Check each required database
                for (const dbName of this.requiredDatabases) {
                    try {
                        const listSNL = `list(database)\nvalues("${dbName}")\non()`;
                        const result = await this.sender.executeSNL(listSNL);
                        status.databases[dbName] = {
                            exists: !!(result && Object.keys(result).length > 0),
                            lastChecked: new Date().toISOString()
                        };
                    } catch (error) {
                        status.databases[dbName] = {
                            exists: false,
                            error: error.message,
                            lastChecked: new Date().toISOString()
                        };
                    }
                }

                // Check AI instances
                for (const aiName of keysVO.getAINames()) {
                    try {
                        const aiUrl = keysVO.getAIUrl(aiName);
                        const aiToken = keysVO.getAIToken(aiName);

                        if (aiUrl && aiToken) {
                            const aiSender = new AISender();
                            aiSender.initialize(aiUrl, aiToken);

                            status.aiInstances[aiName] = {
                                connected: await aiSender.testConnection(),
                                url: aiUrl,
                                hasToken: !!aiToken,
                                lastChecked: new Date().toISOString()
                            };
                        } else {
                            status.aiInstances[aiName] = {
                                connected: false,
                                error: 'Missing URL or token',
                                lastChecked: new Date().toISOString()
                            };
                        }
                    } catch (error) {
                        status.aiInstances[aiName] = {
                            connected: false,
                            error: error.message,
                            lastChecked: new Date().toISOString()
                        };
                    }
                }
            }

            return status;

        } catch (error) {
            console.error('Failed to get database status:', error);
            return {
                connected: false,
                error: error.message,
                databases: {},
                aiInstances: {}
            };
        }
    }

    /**
     * Reinitialize all databases
     * @returns {Promise<void>}
     */
    async reinitializeAll() {
        try {
            console.log('🔄 Reinitializing all databases...');
            await this.initializeAll();
            console.log('✅ Database reinitialization completed');

        } catch (error) {
            console.error('❌ Database reinitialization failed:', error);
            throw error;
        }
    }
}

module.exports = DatabaseInitializer;src/api/support/routes.js