// examples/support_usage_example.js

const SupportModule = require('../src/core/support');
const SupportAPI = require('../src/api/support/support_api');
const { initialize } = require('../src/data/manager/keys_vo_manager');

/**
 * Example usage of Support Module
 */
async function demonstrateSupportModule() {
    try {
        console.log('🚀 Support Module Demo\n');

        // Initialize KeysVO Manager
        await initialize();
        console.log('✅ KeysVO Manager initialized\n');

        // Initialize Support Module for AI
        const aiName = 'ami'; // Replace with actual AI name
        const supportModule = new SupportModule(aiName);
        await supportModule.initialize();
        console.log(`✅ Support Module initialized for AI: ${aiName}\n`);

        // Example user
        const userEmail = 'demo@example.com';
        await supportModule.initializeUser(userEmail);
        console.log(`✅ User initialized: ${userEmail}\n`);

        // Demonstrate Command Service
        console.log('📝 Command Service Demo:');
        const commandService = supportModule.getService('command');

        const sampleCommand = {
            id: 'cmd_001',
            name: 'Sample Frontend Command',
            description: 'A sample frontend command for demo',
            commandType: 'frontend',
            title: 'Demo Form',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    bagName: 'user_name',
                    enabled: true
                },
                {
                    name: 'email',
                    type: 'email',
                    bagName: 'user_email',
                    enabled: true
                }
            ]
        };

        // This would normally use actual user permissions and token
        console.log('   - Command structure created:', sampleCommand.name);

        // Demonstrate Timeline Service
        console.log('\n📅 Timeline Service Demo:');
        const timelineService = supportModule.getService('timeline');

        console.log('   - Timeline service ready for interaction recording');
        console.log('   - Supports search, tagging, and period-based retrieval');

        // Demonstrate Config Service
        console.log('\n⚙️ Config Service Demo:');
        const configService = supportModule.getService('config');

        const sampleTheme = {
            primaryColors: {
                black: '#000000',
                white: '#FFFFFF',
                darkBlue: '#0363AE',
                darkPurple: '#50038F'
            },
            secondaryColors: {
                purple: '#6332F5',
                turquoise: '#54D3EC',
                blue: '#2F62CD',
                teal: '#3AA3A9'
            }
        };

        console.log('   - Default ArcH theme configured:', Object.keys(sampleTheme));

        // Demonstrate Tag Service
        console.log('\n🏷️ Tag Service Demo:');
        const tagService = supportModule.getService('tag');

        console.log('   - Tag service ready for entity tagging');
        console.log('   - Supports add, remove, list, match, and view operations');

        // Demonstrate Database Service
        console.log('\n🗄️ Database Service Demo:');
        const databaseService = supportModule.getService('database');

        console.log('   - Database service ready for DB/namespace management');
        console.log('   - Requires appropriate admin permissions');

        // Demonstrate User Data Service
        console.log('\n👤 User Data Service Demo:');
        const userDataService = supportModule.getService('userData');

        console.log('   - User data service ready for personal data storage');
        console.log('   - Supports pointer, structure, and enum data types');

        // Demonstrate SNL Service
        console.log('\n🔧 SNL Service Demo:');
        const snlService = supportModule.getService('snl');

        const sampleSNL = 'view(structure)\\non(user-data.demo_user.sample)';
        console.log('   - SNL service ready for direct command execution');
        console.log('   - Sample command:', sampleSNL);

        console.log('\n✨ Support Module Demo completed successfully!');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

// Initialize Support API
async function demonstrateSupportAPI() {
    try {
        console.log('\n🌐 Support API Demo\n');

        // Initialize Support API
        const supportAPI = new SupportAPI();
        await supportAPI.initializeAll();

        console.log('✅ Support API initialized for all available AIs');
        console.log('📡 API endpoints available:');
        console.log('   - POST /{aiName}/support/command - Create command');
        console.log('   - GET  /{aiName}/support/commands - List commands');
        console.log('   - POST /{aiName}/support/timeline - Record interaction');
        console.log('   - GET  /{aiName}/support/timeline - Get timeline');
        console.log('   - GET  /{aiName}/support/config - Get AI config');
        console.log('   - PUT  /{aiName}/support/config/theme - Update theme');
        console.log('   - POST /{aiName}/support/tag - Add tag');
        console.log('   - GET  /{aiName}/support/tags - List tags');
        console.log('   - POST /{aiName}/support/db - Create database');
        console.log('   - GET  /{aiName}/support/db - List databases');
        console.log('   - POST /{aiName}/support/data/pointer - Store pointer');
        console.log('   - GET  /{aiName}/support/data - List user data');
        console.log('   - POST /{aiName}/support/snl - Execute SNL');

    } catch (error) {
        console.error('❌ API Demo failed:', error.message);
    }
}

// Run demos if called directly
if (require.main === module) {
    demonstrateSupportModule()
        .then(() => demonstrateSupportAPI())
        .catch(console.error);
}

module.exports = {
    demonstrateSupportModule,
    demonstrateSupportAPI
};

