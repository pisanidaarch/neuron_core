// src/index.js
require('dotenv').config();
const Server = require('./api/server');
const ConfigVO = require('./cross/entities/config.vo');
const AIKeysVO = require('./cross/entities/ai-keys.vo');
const neuronDBSender = require('./data/sender/neurondb.sender');
const snl = require('./data/snl');
const { CACHE_KEYS, ENTITY_TYPES } = require('./cross/constants');

class NeuronCore {
  constructor() {
    this.server = new Server();
    this.refreshInterval = null;
  }

  async start() {
    try {
      console.log('Starting Neuron-Core...');

      // Validate environment
      this.validateEnvironment();

      // Initialize system
      await this.initializeSystem();

      // Start refresh cycle
      this.startRefreshCycle();

      // Start server
      const port = process.env.PORT || 3000;
      await this.server.start(port);

      console.log('Neuron-Core started successfully');
    } catch (error) {
      console.error('Failed to start Neuron-Core:', error);
      process.exit(1);
    }
  }

  validateEnvironment() {
    const required = ['NEURONDB_CONFIG_JWT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  async initializeSystem() {
    console.log('Initializing system...');

    // Load AI configurations
    await this.loadAIConfigurations();

    // Initialize database security
    await this.initializeEntities();

    console.log('System initialization complete');
  }

  async loadAIConfigurations() {
    try {
      console.log('Loading AI configurations...');

      const configToken = ConfigVO.CONFIG_JWT;
      const snlCommand = snl.aiconfig.getAll();
      const result = await neuronDBSender.executeSNL(snlCommand, configToken);

      if (!result) {
        throw new Error('No AI configurations found');
      }

      const aiKeys = new AIKeysVO(result);
      ConfigVO.set(CACHE_KEYS.AI_KEYS, aiKeys);

      console.log(`Loaded ${aiKeys.getAllAIs().length} AI configurations`);
    } catch (error) {
      throw new Error(`Failed to load AI configurations: ${error.message}`);
    }
  }

  async initializeEntities() {
    console.log('Checking and initializing database security...');

    const entities = [
      { name: 'usergroups', type: ENTITY_TYPES.STRUCTURE },
      { name: 'plans', type: ENTITY_TYPES.STRUCTURE },
      { name: 'usersplans', type: ENTITY_TYPES.STRUCTURE },
      { name: 'userroles', type: ENTITY_TYPES.STRUCTURE },
      { name: 'subscription', type: ENTITY_TYPES.STRUCTURE },
      { name: 'planlimits', type: ENTITY_TYPES.STRUCTURE },
      { name: 'billing', type: ENTITY_TYPES.STRUCTURE }
    ];

    const aiKeys = ConfigVO.get(CACHE_KEYS.AI_KEYS);
    const aiList = aiKeys.getAllAIs();

    // Use the first AI's token for system operations
    if (aiList.length === 0) {
      throw new Error('No AI configurations available');
    }

    const systemToken = aiKeys.getToken(aiList[0]);

    for (const entity of entities) {
      try {
        // Check if entity exists
        const checkSnl = snl.aiconfig.checkEntityExists('main', 'core', entity.name, entity.type);
        await neuronDBSender.executeSNL(checkSnl, systemToken);
        console.log(`Entity ${entity.name} already exists`);
      } catch (error) {
        // Entity doesn't exist, create it
        console.log(`Creating entity ${entity.name}...`);

        let createSnl;
        switch (entity.name) {
          case 'usergroups':
            createSnl = snl.usergroups.create();
            break;
          case 'plans':
            createSnl = snl.plans.create();
            break;
          case 'usersplans':
            createSnl = snl.usersplans.create();
            break;
          case 'userroles':
            createSnl = snl.userroles.create();
            break;
          case 'subscription':
            createSnl = snl.subscription.create();
            break;
          case 'planlimits':
            createSnl = snl.planlimits.create();
            break;
          case 'billing':
            createSnl = snl.billing.create();
            break;
        }

        await neuronDBSender.executeSNL(createSnl, systemToken);
        console.log(`Entity ${entity.name} created successfully`);
      }
    }
  }

  startRefreshCycle() {
    // Refresh configurations every 5 minutes
    const refreshInterval = 5 * 60 * 1000; // 5 minutes

    this.refreshInterval = setInterval(async () => {
      try {
        console.log('Refreshing configurations...');
        await this.loadAIConfigurations();
        // In the future, also refresh agent configurations and behaviors
      } catch (error) {
        console.error('Failed to refresh configurations:', error);
      }
    }, refreshInterval);
  }

  async stop() {
    console.log('Stopping Neuron-Core...');

    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Stop server
    await this.server.stop();

    // Clear cache
    ConfigVO.flushAll();

    console.log('Neuron-Core stopped');
  }
}

// Handle process termination
const neuronCore = new NeuronCore();

process.on('SIGTERM', async () => {
  await neuronCore.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await neuronCore.stop();
  process.exit(0);
});

// Start the application
neuronCore.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});