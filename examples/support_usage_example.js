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

// tests/unit/support/command_service.test.js

const CommandService = require('../../../src/core/support/command_service');
const FrontendCommand = require('../../../src/cross/entity/frontend_command');

/**
 * Command Service Unit Tests
 */
describe('CommandService', () => {
    let commandService;
    const mockAIName = 'test-ai';
    const mockUserEmail = 'test@example.com';
    const mockToken = 'mock-jwt-token';
    const mockPermissions = [
        { database: 'user-data', level: 2 },
        { database: 'main', level: 3 }
    ];

    beforeEach(() => {
        commandService = new CommandService(mockAIName);

        // Mock the manager
        commandService.manager = {
            createCommand: jest.fn(),
            getCommand: jest.fn(),
            updateCommand: jest.fn(),
            deleteCommand: jest.fn(),
            listCommands: jest.fn(),
            searchCommands: jest.fn()
        };
    });

    describe('createCommand', () => {
        test('should create a frontend command successfully', async () => {
            const commandData = {
                id: 'cmd_001',
                name: 'Test Frontend Command',
                commandType: 'frontend',
                title: 'Test Form',
                fields: [
                    {
                        name: 'name',
                        type: 'text',
                        bagName: 'user_name',
                        enabled: true
                    }
                ]
            };

            const mockResult = {
                success: true,
                commandId: 'cmd_001',
                data: {}
            };

            commandService.manager.createCommand.mockResolvedValue(mockResult);

            const result = await commandService.createCommand(
                commandData,
                mockPermissions,
                mockUserEmail,
                mockToken
            );

            expect(result).toEqual({
                ...mockResult,
                database: 'user-data',
                namespace: expect.stringContaining('test_at_example_com'),
                commandType: 'frontend'
            });

            expect(commandService.manager.createCommand).toHaveBeenCalledWith(
                expect.any(FrontendCommand),
                'user-data',
                expect.stringContaining('test_at_example_com'),
                mockToken
            );
        });

        test('should validate command data', async () => {
            const invalidCommandData = {
                id: '',
                name: '',
                commandType: 'frontend'
            };

            await expect(
                commandService.createCommand(
                    invalidCommandData,
                    mockPermissions,
                    mockUserEmail,
                    mockToken
                )
            ).rejects.toThrow('Command validation failed');
        });
    });

    describe('getCommand', () => {
        test('should retrieve command successfully', async () => {
            const mockCommand = new FrontendCommand({
                id: 'cmd_001',
                name: 'Test Command',
                title: 'Test Form'
            });

            commandService.manager.getCommand.mockResolvedValue(mockCommand);

            const result = await commandService.getCommand(
                'cmd_001',
                null,
                mockPermissions,
                mockUserEmail,
                mockToken
            );

            expect(result).toEqual({
                command: mockCommand,
                location: expect.any(Object)
            });
        });

        test('should return null for non-existent command', async () => {
            commandService.manager.getCommand.mockResolvedValue(null);

            const result = await commandService.getCommand(
                'non-existent',
                null,
                mockPermissions,
                mockUserEmail,
                mockToken
            );

            expect(result).toBeNull();
        });
    });

    describe('listCommands', () => {
        test('should list commands from user data by default', async () => {
            const mockCommandIds = ['cmd_001', 'cmd_002'];
            commandService.manager.listCommands.mockResolvedValue(mockCommandIds);

            const result = await commandService.listCommands(
                null,
                '*',
                mockPermissions,
                mockUserEmail,
                mockToken
            );

            expect(result).toEqual({
                commands: mockCommandIds,
                location: {
                    database: 'user-data',
                    namespace: expect.stringContaining('test_at_example_com')
                }
            });
        });
    });
});

// tests/unit/support/timeline_service.test.js

const TimelineService = require('../../../src/core/support/timeline_service');
const TimelineEntry = require('../../../src/cross/entity/timeline_entry');

/**
 * Timeline Service Unit Tests
 */
describe('TimelineService', () => {
    let timelineService;
    const mockAIName = 'test-ai';
    const mockUserEmail = 'test@example.com';
    const mockToken = 'mock-jwt-token';

    beforeEach(() => {
        timelineService = new TimelineService(mockAIName);

        // Mock the manager
        timelineService.manager = {
            recordEntry: jest.fn(),
            getEntriesByPeriod: jest.fn(),
            searchEntries: jest.fn(),
            addTagToEntry: jest.fn(),
            listTimelineEntities: jest.fn()
        };
    });

    describe('recordInteraction', () => {
        test('should record interaction successfully', async () => {
            const userInput = 'Hello, how are you?';
            const aiResponse = 'I am doing well, thank you!';
            const metadata = { source: 'chat' };

            const mockResult = {
                success: true,
                entryId: '15_14_30_45_123',
                entityName: '2025-06',
                data: {}
            };

            timelineService.manager.recordEntry.mockResolvedValue(mockResult);

            const result = await timelineService.recordInteraction(
                userInput,
                aiResponse,
                mockUserEmail,
                metadata,
                mockToken
            );

            expect(result).toEqual({
                ...mockResult,
                entry: expect.any(Object)
            });

            expect(timelineService.manager.recordEntry).toHaveBeenCalledWith(
                expect.any(TimelineEntry),
                mockToken
            );
        });

        test('should validate required inputs', async () => {
            await expect(
                timelineService.recordInteraction(
                    '',
                    '',
                    mockUserEmail,
                    {},
                    mockToken
                )
            ).rejects.toThrow('validation failed');
        });
    });

    describe('getTimelineByPeriod', () => {
        test('should get timeline entries for specific period', async () => {
            const mockEntries = [
                new TimelineEntry({
                    userInput: 'Test input',
                    aiResponse: 'Test response',
                    userEmail: mockUserEmail,
                    aiName: mockAIName
                })
            ];

            timelineService.manager.getEntriesByPeriod.mockResolvedValue(mockEntries);

            const result = await timelineService.getTimelineByPeriod(
                mockUserEmail,
                2025,
                6,
                15,
                null,
                mockToken
            );

            expect(result).toEqual({
                period: { year: 2025, month: 6, day: 15, hour: null },
                count: 1,
                entries: expect.any(Array)
            });
        });

        test('should validate year parameter', async () => {
            await expect(
                timelineService.getTimelineByPeriod(
                    mockUserEmail,
                    1999,
                    null,
                    null,
                    null,
                    mockToken
                )
            ).rejects.toThrow('Valid year is required');
        });
    });

    describe('searchTimeline', () => {
        test('should search timeline entries', async () => {
            const searchTerm = 'test query';
            const mockEntries = [];

            timelineService.manager.searchEntries.mockResolvedValue(mockEntries);

            const result = await timelineService.searchTimeline(
                mockUserEmail,
                searchTerm,
                mockToken
            );

            expect(result).toEqual({
                searchTerm,
                count: 0,
                entries: []
            });
        });

        test('should validate search term length', async () => {
            await expect(
                timelineService.searchTimeline(
                    mockUserEmail,
                    'a',
                    mockToken
                )
            ).rejects.toThrow('Search term must be at least 2 characters');
        });
    });
});

// tests/integration/support/support_api.test.js

const request = require('supertest');
const express = require('express');
const SupportAPI = require('../../../src/api/support/support_api');

/**
 * Support API Integration Tests
 */
describe('Support API Integration', () => {
    let app;
    let supportAPI;
    const mockAIName = 'test-ai';

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.text());

        // Mock auth middleware
        app.use((req, res, next) => {
            req.user = {
                email: 'test@example.com',
                permissions: [
                    { database: 'user-data', level: 2 },
                    { database: 'main', level: 3 }
                ]
            };
            next();
        });

        supportAPI = new SupportAPI();
        const router = supportAPI.initialize(mockAIName);
        app.use('/', router);
    });

    describe('Command API', () => {
        test('POST /{aiName}/support/command should create command', async () => {
            const commandData = {
                id: 'cmd_test_001',
                name: 'Test Command',
                commandType: 'frontend',
                title: 'Test Form',
                fields: []
            };

            const response = await request(app)
                .post(`/${mockAIName}/support/command`)
                .set('Authorization', 'Bearer mock-token')
                .send(commandData);

            expect(response.status).toBe(201);
            expect(response.body.error).toBe(false);
            expect(response.body.message).toContain('created successfully');
        });

        test('GET /{aiName}/support/commands should list commands', async () => {
            const response = await request(app)
                .get(`/${mockAIName}/support/commands`)
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.error).toBe(false);
        });
    });

    describe('Timeline API', () => {
        test('POST /{aiName}/support/timeline should record interaction', async () => {
            const interactionData = {
                userInput: 'Hello world',
                aiResponse: 'Hello back!',
                metadata: { source: 'test' }
            };

            const response = await request(app)
                .post(`/${mockAIName}/support/timeline`)
                .set('Authorization', 'Bearer mock-token')
                .send(interactionData);

            expect(response.status).toBe(201);
            expect(response.body.error).toBe(false);
        });

        test('GET /{aiName}/support/timeline should get timeline', async () => {
            const response = await request(app)
                .get(`/${mockAIName}/support/timeline`)
                .query({ year: 2025 })
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.error).toBe(false);
        });
    });

    describe('Config API', () => {
        test('GET /{aiName}/support/config should get AI config', async () => {
            const response = await request(app)
                .get(`/${mockAIName}/support/config`)
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.error).toBe(false);
        });

        test('PUT /{aiName}/support/config/theme should update theme', async () => {
            const themeData = {
                primaryColors: {
                    black: '#000000',
                    white: '#FFFFFF'
                }
            };

            const response = await request(app)
                .put(`/${mockAIName}/support/config/theme`)
                .set('Authorization', 'Bearer mock-token')
                .send(themeData);

            expect(response.status).toBe(200);
            expect(response.body.error).toBe(false);
        });
    });

    describe('SNL API', () => {
        test('POST /{aiName}/support/snl should execute SNL command', async () => {
            const snlCommand = 'view(structure)\\non(user-data.test_user.sample)';

            const response = await request(app)
                .post(`/${mockAIName}/support/snl`)
                .set('Authorization', 'Bearer mock-token')
                .set('Content-Type', 'text/plain')
                .send(snlCommand);

            expect(response.status).toBe(200);
            expect(response.body.error).toBe(false);
        });
    });
});

module.exports = {
    // Export test suites for use in other test files
};