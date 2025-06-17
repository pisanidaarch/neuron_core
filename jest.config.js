// jest.config.js

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js'
  ],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Setup files
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@entities/(.*)$': '<rootDir>/src/cross/entity/$1',
    '^@managers/(.*)$': '<rootDir>/src/data/manager/$1',
    '^@snl/(.*)$': '<rootDir>/src/data/snl/$1'
  },

  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};