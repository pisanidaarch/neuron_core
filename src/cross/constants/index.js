// src/cross/constants/index.js
module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    DEFAULT: 'default'
  },

  // NeuronDB Permissions
  PERMISSIONS: {
    READ_ONLY: 1,
    READ_WRITE: 2,
    ADMIN: 3
  },

  // Cache Keys
  CACHE_KEYS: {
    AI_KEYS: 'ai_keys',
    PLANS: 'plans',
    USER_GROUPS: 'user_groups'
  },

  // NeuronDB Paths
  NEURONDB_PATHS: {
    CONFIG_AI: 'config.general.ai',
    MAIN_CORE: 'main.core'
  },

  // Entity Types
  ENTITY_TYPES: {
    ENUM: 'enum',
    STRUCTURE: 'structure',
    POINTER: 'pointer',
    IPOINTER: 'ipointer'
  },

  // Error Messages
  ERRORS: {
    INVALID_AI: 'Invalid AI name',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid token',
    USER_NOT_FOUND: 'User not found',
    PLAN_NOT_FOUND: 'Plan not found',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
  }
};
