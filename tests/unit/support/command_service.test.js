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