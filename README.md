# NeuronCore - KeysVO Implementation

## Overview

This implementation provides the foundational configuration management system for NeuronCore using JavaScript/Node.js. The KeysVO (Keys Value Object) is responsible for managing system-wide configuration including AI instances and agent configurations.

## Architecture

Following the layered architecture pattern:

```
src/
├── cross/
│   └── entity/
│       └── keys_vo.js          # Singleton VO for configuration
└── data/
    ├── neuron_db/
    │   └── sender.js           # HTTP client for NeuronDB
    ├── snl/
    │   └── keys_vo_snl.js      # SNL commands for KeysVO
    └── manager/
        └── keys_vo_manager.js  # Manager for KeysVO operations
```

### Components

1. **KeysVO (Entity Layer)**
   - Singleton pattern implementation
   - 5-minute auto-refresh mechanism
   - Stores AI configurations and agent settings
   - Maintains data even if refresh fails

2. **NeuronDBSender (Data Layer)**
   - HTTP client for all NeuronDB operations
   - Supports SNL execution and admin operations
   - Comprehensive error handling
   - Token-based authentication

3. **KeysVOSNL (Data Layer)**
   - Contains all SNL commands for configuration
   - Parsing logic for NeuronDB responses
   - Validation and normalization of data

4. **KeysVOManager (Data Layer)**
   - Orchestrates data loading and refresh
   - Manages concurrent operations
   - Provides simplified API for upper layers

## Installation

```bash
npm install
```

## Configuration

1. Copy the configuration template:
```bash
cp config.json.example config.json
```

2. Edit `config.json` with your actual tokens:
```json
{
  "neuronDB": {
    "url": "https://ndb.archoffice.tech",
    "configToken": "your-actual-config-token-here"
  },
  "server": {
    "port": 3000
  },
  "testing": {
    "neuronDBToken": "your-test-token-here"
  }
}
```

**Important**: Never commit `config.json` with real tokens. It's already in `.gitignore`.

## Usage

### Basic Initialization

```javascript
const { initialize, getInstance } = require('./src/data/manager/keys_vo_manager');

// Initialize (will use token from config.json)
await initialize();

// Get manager instance
const manager = getInstance();

// Get AI configuration
const aiConfig = await manager.getAIConfig('ami');

// Get agent configuration
const agentConfig = await manager.getAgentConfig('gpt');
```

### Direct NeuronDB Operations

```javascript
const NeuronDBSender = require('./src/data/neuron_db/sender');
const sender = new NeuronDBSender();

// Execute SNL
const result = await sender.executeSNL(
    'view(structure)\non(main.core.users)',
    token
);

// Admin operations
await sender.createDatabase(token, 'new-db');
await sender.createNamespace(token, 'db-name', 'namespace-name');
```

## Key Features

1. **Auto-refresh**: Configuration automatically refreshes every 5 minutes
2. **Fault tolerance**: Maintains existing data if refresh fails
3. **Concurrent loading**: Loads multiple configurations in parallel
4. **Type safety**: Validates and normalizes all data
5. **Multi-tenant support**: Isolates data by AI instance

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage
```

## Configuration

The system expects the following structure from NeuronDB:

### AI Configuration
```json
{
  "ami": {
    "ami": "jwt-token-here"
  }
}
```

### Agent Configuration
```json
{
  "gpt": {
    "apiKey": "api-key",
    "url": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-4o",
    "max_tokens": 4096
  }
}
```

### Behavior Configuration
```json
{
  "default": {
    "behavior": "AI behavior description"
  }
}
```

## Error Handling

All errors are properly caught and logged. The system maintains functionality even when:
- NeuronDB is temporarily unavailable
- Specific configurations fail to load
- Network issues occur

## Security Notes

1. Config token should be stored securely
2. Never expose tokens in logs or error messages
3. Use environment variables for sensitive data
4. Implement proper token rotation

## Next Steps

This implementation provides the foundation for:
- Security module implementation
- Support module implementation  
- Core API implementation
- Additional entity management