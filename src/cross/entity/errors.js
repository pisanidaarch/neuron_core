// src/cross/entity/errors.js

/**
 * Base error class for NeuronCore
 */
class NeuronCoreError extends Error {
    constructor(message, code = 'NEURON_CORE_ERROR', statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: true,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode
        };
    }
}

/**
 * Configuration related errors
 */
class ConfigurationError extends NeuronCoreError {
    constructor(message, details = null) {
        super(message, 'CONFIG_ERROR', 500);
        this.details = details;
    }
}

/**
 * NeuronDB communication errors
 */
class NeuronDBError extends NeuronCoreError {
    constructor(message, statusCode = 500, data = null) {
        super(message, 'NEURON_DB_ERROR', statusCode);
        this.data = data;
    }
}

/**
 * Authentication errors
 */
class AuthenticationError extends NeuronCoreError {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTH_ERROR', 401);
    }
}

/**
 * Authorization errors
 */
class AuthorizationError extends NeuronCoreError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'AUTHZ_ERROR', 403);
    }
}

/**
 * Validation errors
 */
class ValidationError extends NeuronCoreError {
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
}

/**
 * Not found errors
 */
class NotFoundError extends NeuronCoreError {
    constructor(resource, identifier = null) {
        const message = identifier
            ? `${resource} not found: ${identifier}`
            : `${resource} not found`;
        super(message, 'NOT_FOUND', 404);
        this.resource = resource;
        this.identifier = identifier;
    }
}

/**
 * Timeout errors
 */
class TimeoutError extends NeuronCoreError {
    constructor(operation, timeout) {
        super(`Operation '${operation}' timed out after ${timeout}ms`, 'TIMEOUT_ERROR', 408);
        this.operation = operation;
        this.timeout = timeout;
    }
}

/**
 * Rate limit errors
 */
class RateLimitError extends NeuronCoreError {
    constructor(limit, window, retryAfter = null) {
        const message = `Rate limit exceeded: ${limit} requests per ${window}`;
        super(message, 'RATE_LIMIT', 429);
        this.limit = limit;
        this.window = window;
        this.retryAfter = retryAfter;
    }
}

module.exports = {
    NeuronCoreError,
    ConfigurationError,
    NeuronDBError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    TimeoutError,
    RateLimitError
};