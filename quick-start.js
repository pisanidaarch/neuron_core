// quick-start.js - Quick setup script for NeuronCore

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

async function quickStart() {
    console.log('\n🧠 NeuronCore Quick Start Setup');
    console.log('================================\n');

    // Check if config.json exists
    const configPath = path.join(process.cwd(), 'config.json');
    const configExamplePath = path.join(process.cwd(), 'config.json.example');

    if (fs.existsSync(configPath)) {
        console.log('✅ config.json already exists');
        const overwrite = await prompt('Do you want to reconfigure it? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('👍 Using existing configuration');
            rl.close();
            return;
        }
    }

    console.log('📋 Let\'s configure your NeuronCore...\n');

    // Get configuration from user
    const config = {
        database: {},
        ai_instances: {},
        security: {},
        server: {},
        colors: {
            primary: {
                black: "#000000",
                white: "#FFFFFF",
                dark_blue: "#0363AE",
                dark_purple: "#50038F"
            },
            secondary: {
                purple: "#6332F5",
                turquoise: "#54D3EC",
                blue: "#2F62CD",
                teal: "#3AA3A9"
            },
            gradients: {
                primary: "linear-gradient(135deg, #50038F 0%, #0363AE 100%)",
                secondary: "linear-gradient(135deg, #6332F5 0%, #54D3EC 100%)"
            }
        }
    };

    // Database configuration
    console.log('🗄️  Database Configuration');
    config.database.config_url = await prompt('NeuronDB URL (default: http://localhost:8080): ') || 'http://localhost:8080';
    config.database.config_token = await prompt('NeuronDB Config Token: ');

    if (!config.database.config_token) {
        console.log('⚠️  Warning: Empty config token. You\'ll need to set this later.');
        config.database.config_token = 'CHANGE_ME_CONFIG_TOKEN';
    }

    // AI instances
    console.log('\n🤖 AI Instance Configuration');
    const aiName = await prompt('AI Instance Name (default: demo_ai): ') || 'demo_ai';
    const aiUrl = await prompt(`AI Instance URL (default: ${config.database.config_url}): `) || config.database.config_url;
    const aiToken = await prompt('AI Instance Token: ');

    if (!aiToken) {
        console.log('⚠️  Warning: Empty AI token. You\'ll need to set this later.');
    }

    config.ai_instances[aiName] = {
        name: aiName,
        url: aiUrl,
        token: aiToken || 'CHANGE_ME_AI_TOKEN'
    };

    // Security configuration
    console.log('\n🔐 Security Configuration');
    config.security.jwt_secret = await prompt('JWT Secret (press Enter for auto-generated): ');

    if (!config.security.jwt_secret) {
        // Generate a random JWT secret
        config.security.jwt_secret = require('crypto').randomBytes(64).toString('hex');
        console.log('✅ Auto-generated JWT secret');
    }

    config.security.token_expiry = await prompt('Token Expiry (default: 24h): ') || '24h';

    // Server configuration
    console.log('\n🌐 Server Configuration');
    config.server.port = parseInt(await prompt('Server Port (default: 3000): ') || '3000');
    config.server.cors_origin = await prompt('CORS Origin (default: *): ') || '*';

    // Save configuration
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('\n✅ Configuration saved to config.json');
    } catch (error) {
        console.error('\n❌ Failed to save configuration:', error.message);
        rl.close();
        return;
    }

    // Show summary
    console.log('\n📋 Configuration Summary:');
    console.log(`   Database URL: ${config.database.config_url}`);
    console.log(`   AI Instance: ${aiName} (${aiUrl})`);
    console.log(`   Server Port: ${config.server.port}`);
    console.log(`   JWT Secret: ${config.security.jwt_secret ? 'Set' : 'Not set'}`);

    console.log('\n🎉 Setup completed!');
    console.log('\nNext steps:');
    console.log('1. Make sure NeuronDB is running');
    console.log('2. Update tokens in config.json if needed');
    console.log('3. Run: npm start');
    console.log('4. Test with: curl http://localhost:' + config.server.port + '/health');

    console.log('\n💡 Default system admin:');
    console.log('   Email: subscription_admin@system.local');
    console.log('   Password: sudo_subscription_admin');

    rl.close();
}

// Run the quick start
quickStart().catch(error => {
    console.error('\n❌ Quick start failed:', error.message);
    process.exit(1);
});