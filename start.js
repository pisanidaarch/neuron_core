// start.js - Simple example to start using NeuronCore

const config = require('./src/cross/entity/config');
const { initialize, getInstance } = require('./src/data/manager/keys_vo_manager');

async function main() {
    try {
        console.log('🚀 Starting NeuronCore...\n');

        // Load configuration
        console.log('📋 Loading configuration...');
        config.load();
        console.log('✅ Configuration loaded\n');

        // Initialize KeysVO Manager
        console.log('🔧 Initializing KeysVO Manager...');
        await initialize();
        console.log('✅ KeysVO Manager initialized\n');

        // Get manager instance
        const manager = getInstance();

        // Load and display available AIs
        console.log('🤖 Available AIs:');
        const keysVO = await manager.getKeysVO();
        const aiNames = keysVO.getAINames();
        aiNames.forEach(ai => console.log(`   - ${ai}`));
        console.log();

        // Load and display available agents
        console.log('🔌 Available Agents:');
        const agentNames = keysVO.getAgentNames();
        agentNames.forEach(agent => console.log(`   - ${agent}`));
        console.log();

        // Example: Get specific AI configuration
        if (aiNames.length > 0) {
            const firstAI = aiNames[0];
            const aiConfig = await manager.getAIConfig(firstAI);
            console.log(`📊 Configuration for AI '${firstAI}':`);
            console.log(`   - Has token: ${!!aiConfig[firstAI]}`);
            console.log(`   - Has behavior: ${!!aiConfig.behavior}`);
            if (aiConfig.behavior?.default?.behavior) {
                console.log(`   - Default behavior: "${aiConfig.behavior.default.behavior}"`);
            }
        }

        console.log('\n✨ NeuronCore is ready to use!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the example
main();