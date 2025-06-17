// src/cross/entity/errors.js

/**
 * Base Error Class
 */
class BaseError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp
        };
    }
}

/**
 * Validation Error - Used when entity validation fails
 */
class ValidationError extends BaseError {
    constructor(message, field = null) {
        super(message, 400);
        this.field = field;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field
        };
    }
}

/**
 * Not Found Error - Used when resource is not found
 */
class NotFoundError extends BaseError {
    constructor(message, resource = null) {
        super(message, 404);
        this.resource = resource;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            resource: this.resource
        };
    }
}

/**
 * Authorization Error - Used when user lacks permissions
 */
class AuthorizationError extends BaseError {
    constructor(message, requiredPermission = null) {
        super(message, 403);
        this.requiredPermission = requiredPermission;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            requiredPermission: this.requiredPermission
        };
    }
}

/**
 * Authentication Error - Used when authentication fails
 */
class AuthenticationError extends BaseError {
    constructor(message) {
        super(message, 401);
    }
}

/**
 * Conflict Error - Used when there's a conflict (e.g., duplicate resource)
 */
class ConflictError extends BaseError {
    constructor(message, conflictingResource = null) {
        super(message, 409);
        this.conflictingResource = conflictingResource;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            conflictingResource: this.conflictingResource
        };
    }
}

/**
 * NeuronDB Error - Used for database-specific errors
 */
class NeuronDBError extends BaseError {
    constructor(message, operation = null) {
        super(message, 500);
        this.operation = operation;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation
        };
    }
}

/**
 * SNL Error - Used for SNL syntax or execution errors
 */
class SNLError extends BaseError {
    constructor(message, snlCommand = null) {
        super(message, 400);
        this.snlCommand = snlCommand;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            snlCommand: this.snlCommand
        };
    }
}

/**
 * Configuration Error - Used for configuration issues
 */
class ConfigurationError extends BaseError {
    constructor(message, configKey = null) {
        super(message, 500);
        this.configKey = configKey;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            configKey: this.configKey
        };
    }
}

/**
 * Rate Limit Error - Used when rate limits are exceeded
 */
class RateLimitError extends BaseError {
    constructor(message, retryAfter = null) {
        super(message, 429);
        this.retryAfter = retryAfter;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter
        };
    }
}

/**
 * Timeout Error - Used for operation timeouts
 */
class TimeoutError extends BaseError {
    constructor(message, operation = null) {
        super(message, 408);
        this.operation = operation;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation
        };
    }
}

module.exports = {
    BaseError,
    ValidationError,
    NotFoundError,
    AuthorizationError,
    AuthenticationError,
    ConflictError,
    NeuronDBError,
    SNLError,
    ConfigurationError,
    RateLimitError,
    TimeoutError
};