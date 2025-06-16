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