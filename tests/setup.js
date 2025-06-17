// tests/setup.js

// Set test environment
process.env.NODE_ENV = 'test';

// Mock config for tests
const mockConfig = {
    database: {
        config_url: 'http://localhost:8080',
        config_token: 'test_config_token'
    },
    ai_instances: {
        test_ai: {
            name: 'test_ai',
            url: 'http://localhost:8080',
            token: 'test_ai_token'
        }
    },
    security: {
        jwt_secret: 'test_jwt_secret',
        token_expiry: '24h',
        bcrypt_rounds: 10
    },
    server: {
        port: 3001,
        cors_origin: '*'
    }
};

// Mock the config module
jest.mock('../config.json', () => mockConfig, { virtual: true });

// Global test utilities
global.testUtils = {
    // Create mock user
    createMockUser: (overrides = {}) => ({
        email: 'test@example.com',
        nick: 'Test User',
        password: 'test123',
        group: 'default',
        active: true,
        permissions: [],
        metadata: {},
        ...overrides
    }),

    // Create mock group
    createMockGroup: (overrides = {}) => ({
        name: 'test_group',
        description: 'Test group',
        permissions: ['basic_access'],
        system: false,
        metadata: {},
        ...overrides
    }),

    // Create mock permission
    createMockPermission: (overrides = {}) => ({
        email: 'test@example.com',
        database: 'test_db',
        namespace: null,
        entity: null,
        level: 1,
        grantedBy: 'admin@example.com',
        expiresAt: null,
        metadata: {},
        ...overrides
    }),

    // Create mock timeline entry
    createMockTimelineEntry: (overrides = {}) => ({
        id: 'test_entry_123',
        userEmail: 'test@example.com',
        type: 'system',
        content: 'Test entry',
        metadata: {},
        timestamp: new Date().toISOString(),
        tags: [],
        relatedEntries: [],
        ...overrides
    }),

    // Create mock SNL response
    createMockSNLResponse: (data = {}) => ({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
    }),

    // Create mock token
    createMockToken: () => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.test_signature',

    // Sleep utility for async tests
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
    // Suppress console output in tests unless DEBUG is set
    if (!process.env.DEBUG) {
        console.error = jest.fn();
        console.warn = jest.fn();
        console.log = jest.fn();
    }
});

afterAll(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
});

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});