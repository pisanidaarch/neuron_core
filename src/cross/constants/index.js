// src/cross/constants/index.js
module.exports = {
  // User Roles
  ROLES: {
    DEFAULT: 'default',
    ADMIN: 'admin'
  },

  // NeuronDB Permissions
  PERMISSIONS: {
    READ_ONLY: 1,
    READ_WRITE: 2,
    ADMIN: 3
  },

  // Permission Level Names
  PERMISSION_NAMES: {
    1: 'read-only',
    2: 'read-write',
    3: 'admin'
  },

  // Cache Keys
  CACHE_KEYS: {
    AI_KEYS: 'ai_keys',
    PLANS: 'plans',
    USER_GROUPS: 'user_groups',
    USER_ROLES: 'user_roles',
    SUBSCRIPTIONS: 'subscriptions',
    PLAN_LIMITS: 'plan_limits',
    BEHAVIORS: 'behaviors'
  },

  // NeuronDB Paths
  NEURONDB_PATHS: {
    CONFIG_AI: 'config.general.ai',
    MAIN_CORE: 'main.core',
    USERGROUPS: 'main.core.usergroups',
    PLANS: 'main.core.plans',
    USERS_PLANS: 'main.core.usersplans',
    USER_ROLES: 'main.core.userroles',
    SUBSCRIPTION: 'main.core.subscription',
    PLAN_LIMITS: 'main.core.planlimits',
    BILLING: 'main.core.billing'
  },

  // Entity Types
  ENTITY_TYPES: {
    ENUM: 'enum',
    STRUCTURE: 'structure',
    POINTER: 'pointer',
    IPOINTER: 'ipointer'
  },

  // Subscription Status
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended',
    EXPIRED: 'expired'
  },

  // Default Plans
  DEFAULT_PLANS: {
    BASIC: {
      id: 'basic',
      name: 'Plano Básico',
      price: 29.90,
      limits: {
        chatgpt: 500,
        gemini: 300,
        claude: 400,
        users: 1
      }
    },
    PREMIUM: {
      id: 'premium',
      name: 'Plano Premium',
      price: 99.90,
      limits: {
        chatgpt: 2000,
        gemini: 1000,
        claude: 1500,
        users: 5
      }
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: 'Plano Enterprise',
      price: 299.90,
      limits: {
        chatgpt: 10000,
        gemini: 5000,
        claude: 7500,
        users: 50
      }
    }
  },

  // Admin Configuration
  ADMIN: {
    EMAIL: 'pisani@archoffice.tech'
  },

  // Error Messages
  ERRORS: {
    INVALID_AI: 'Invalid AI name',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid token',
    USER_NOT_FOUND: 'User not found',
    PLAN_NOT_FOUND: 'Plan not found',
    SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    AI_CONFIG_NOT_LOADED: 'AI configurations not loaded yet',
    ADMIN_REQUIRED: 'Admin privileges required',
    VALIDATION_FAILED: 'Validation failed',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    DATABASE_ERROR: 'Database operation failed'
  },

  // Success Messages
  MESSAGES: {
    LOGIN_SUCCESS: 'Login successful',
    PASSWORD_CHANGED: 'Password changed successfully',
    USER_CREATED: 'User created successfully',
    SUBSCRIPTION_CREATED: 'Subscription created successfully',
    SUBSCRIPTION_CANCELLED: 'Subscription cancelled successfully',
    PLAN_CREATED: 'Plan created successfully',
    GROUP_CREATED: 'User group created successfully',
    PERMISSION_SET: 'Permission set successfully',
    ROLE_SET: 'User role set successfully'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Agent Types
  AGENT_TYPES: {
    CHATGPT: 'chatgpt',
    GEMINI: 'gemini',
    CLAUDE: 'claude',
    GROK: 'grok',
    DEEPSEEK: 'deepseek'
  },

  // Default Agent Configurations
  DEFAULT_AGENT_CONFIG: {
    temperature: 0.7,
    max_tokens: 1500,
    timeout: 30000
  },

  // SNL Commands
  SNL_COMMANDS: {
    SET: 'set',
    LIST: 'list',
    VIEW: 'view',
    SEARCH: 'search',
    MATCH: 'match',
    REMOVE: 'remove',
    DROP: 'drop',
    TAG: 'tag',
    UNTAG: 'untag',
    AUDIT: 'audit'
  },

  // Configuration
  CONFIG: {
    REFRESH_INTERVAL: 300000, // 5 minutes
    CACHE_TTL: 300, // 5 minutes
    MAX_RETRIES: 3,
    TIMEOUT: 30000 // 30 seconds
  }
};