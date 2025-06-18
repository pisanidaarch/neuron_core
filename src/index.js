// src/index.js
const Server = require('./api/server');
const ConfigVO = require('./cross/entities/config.vo');
const neuronDBSender = require('./data/sender/neurondb.sender');
const snl = require('./data/snl');
const { ENTITY_TYPES } = require('./cross/constants');

class NeuronCore {
  constructor() {
    this.server = new Server();
    this.refreshInterval = null;
    this.config = new ConfigVO();
  }

  async start() {
    try {
      console.log('🚀 Starting Neuron-Core...');

      // Initialize system
      await this.initializeSystem();

      // Start refresh cycle
      this.startRefreshCycle();

      // Start server
      const port = ConfigVO.SERVER_PORT;
      await this.server.start(port);

      console.log(`✅ Neuron-Core started successfully on port ${port}`);
      console.log(`📊 Configuration info:`, this.config.getConfigInfo());
    } catch (error) {
      console.error('❌ Failed to start Neuron-Core:', error);
      process.exit(1);
    }
  }

  async initializeSystem() {
    console.log('Initializing system...');

    // Load AI configurations
    await this.loadAIConfigurations();

    // Initialize database security entities
    await this.initializeEntities();

    console.log('System initialization complete');
  }

  async loadAIConfigurations() {
    try {
      console.log('Loading AI configurations from NeuronDB...');

      const configToken = ConfigVO.CONFIG_JWT;

      // 1. Buscar IAs e suas keys
      console.log('→ Loading AI keys...');
      const aiKeysSnl = snl.aiconfig.getAll();
      const aiKeysResult = await neuronDBSender.executeSNL(aiKeysSnl, configToken);

      if (!aiKeysResult) {
        throw new Error('No AI configurations found');
      }

      // Set AI keys in ConfigVO singleton
      this.config.setAIKeys(aiKeysResult);
      console.log(`✓ Loaded ${this.config.getAllAIs().length} AI configurations:`, this.config.getAllAIs());

      // 2. Buscar behaviors de cada IA
      console.log('→ Loading AI behaviors...');
      const aiList = this.config.getAllAIs();
      for (const aiName of aiList) {
        try {
          const behaviorSnl = snl.behavior.getByAI(aiName);
          const behaviorResult = await neuronDBSender.executeSNL(behaviorSnl, configToken);
          this.config.setBehavior(aiName, behaviorResult);
          console.log(`✓ Behavior loaded for ${aiName}`);
        } catch (error) {
          console.warn(`⚠ Failed to load behavior for ${aiName}:`, error.message);
        }
      }

      // 3. Buscar configurações dos agentes
      console.log('→ Loading agent configurations...');
      const agentSnl = snl.agent.getAll();
      const agentResult = await neuronDBSender.executeSNL(agentSnl, configToken);
      this.config.setAgents(agentResult);
      console.log(`✓ Loaded ${Object.keys(agentResult || {}).length} agent configurations`);

    } catch (error) {
      throw new Error(`Failed to load AI configurations: ${error.message}`);
    }
  }

  async initializeEntities() {
    console.log('Checking and initializing database security entities...');

    const entities = [
      { name: 'usergroups', type: ENTITY_TYPES.STRUCTURE },
      { name: 'plans', type: ENTITY_TYPES.STRUCTURE },
      { name: 'usersplans', type: ENTITY_TYPES.STRUCTURE },
      { name: 'userroles', type: ENTITY_TYPES.STRUCTURE },
      { name: 'subscription', type: ENTITY_TYPES.STRUCTURE },
      { name: 'planlimits', type: ENTITY_TYPES.STRUCTURE },
      { name: 'billing', type: ENTITY_TYPES.STRUCTURE }
    ];

    const aiList = this.config.getAllAIs();

    // Use the first AI's token for system operations
    if (aiList.length === 0) {
      throw new Error('No AI configurations available');
    }

    const systemToken = this.config.getAIToken(aiList[0]);

    for (const entity of entities) {
      try {
        // Check if entity exists
        const checkSnl = snl.aiconfig.checkEntityExists('main', 'core', entity.name, entity.type);
        await neuronDBSender.executeSNL(checkSnl, systemToken);
        console.log(`✓ Entity ${entity.name} already exists`);
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
          default:
            throw new Error(`Unknown entity: ${entity.name}`);
        }

        await neuronDBSender.executeSNL(createSnl, systemToken);
        console.log(`✓ Entity ${entity.name} created successfully`);
      }
    }
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
    this.config.flushAll();

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