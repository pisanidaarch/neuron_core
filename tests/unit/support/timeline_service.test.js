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

