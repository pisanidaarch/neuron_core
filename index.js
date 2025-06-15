// index.js - NeuronCore entry point

const express = require('express');
const config = require('./src/cross/entity/config');
const { initialize, getInstance } = require('./src/data/manager/keys_vo_manager');

// Load configuration
config.load();

const app = express();
const PORT = config.get('server.port');

// Middleware
app.use(express.json());
app.use(express.text()); // For SNL commands

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'neuron-core',
        timestamp: new Date().toISOString()
    });
});

// Example endpoint to get AI configuration
app.get('/config/ai/:aiName', async (req, res) => {
    try {
        const manager = getInstance();
        const aiConfig = await manager.getAIConfig(req.params.aiName);

        if (!aiConfig) {
            return res.status(404).json({
                error: true,
                message: `AI configuration not found for: ${req.params.aiName}`
            });
        }

        // Don't expose the token in response
        const { token, ...safeConfig } = aiConfig;
        res.json({
            error: false,
            data: safeConfig
        });

    } catch (error) {
        console.error('Error getting AI config:', error);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Example endpoint to get agent configuration
app.get('/config/agent/:agentName', async (req, res) => {
    try {
        const manager = getInstance();
        const agentConfig = await manager.getAgentConfig(req.params.agentName);

        if (!agentConfig) {
            return res.status(404).json({
                error: true,
                message: `Agent configuration not found for: ${req.params.agentName}`
            });
        }

        // Don't expose the API key in response
        const { apiKey, ...safeConfig } = agentConfig;
        res.json({
            error: false,
            data: safeConfig
        });

    } catch (error) {
        console.error('Error getting agent config:', error);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: true,
        message: 'Internal server error'
    });
});

// Initialize and start server
async function start() {
    try {
        console.log('Initializing NeuronCore...');

        // Get config token from configuration
        const configToken = config.get('neuronDB.configToken');
        if (!configToken || configToken === 'your-config-token-here') {
            throw new Error('Please configure a valid neuronDB.configToken in config.json');
        }

        // Initialize KeysVO manager
        await initialize(configToken);
        console.log('KeysVO manager initialized successfully');

        // Verify initialization by loading data
        const manager = getInstance();
        const keysVO = await manager.getKeysVO();
        const aiNames = keysVO.getAINames();
        const agentNames = keysVO.getAgentNames();

        console.log(`Loaded ${aiNames.length} AI configurations`);
        console.log(`Loaded ${agentNames.length} agent configurations`);

        // Start server
        app.listen(PORT, () => {
            console.log(`NeuronCore server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });

    } catch (error) {
        console.error('Failed to start NeuronCore:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

// Start the application
start();