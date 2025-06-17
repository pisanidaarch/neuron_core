// src/cross/entity/errors.js

/**
 * Base NeuronCore Error class
 */
class NeuronCoreError extends Error {
    constructor(message, code = 'NEURON_ERROR', statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Configuration related errors
 */
class ConfigurationError extends NeuronCoreError {
    constructor(message) {
        super(message, 'CONFIG_ERROR', 500);
    }
}

/**
 * Authentication related errors
 */
class AuthenticationError extends NeuronCoreError {
    constructor(message) {
        super(message, 'AUTH_ERROR', 401);
    }
}

/**
 * Authorization related errors
 */
class AuthorizationError extends NeuronCoreError {
    constructor(message) {
        super(message, 'AUTHZ_ERROR', 403);
    }
}

/**
 * Validation related errors
 */
class ValidationError extends NeuronCoreError {
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
}

/**
 * Database related errors
 */
class DatabaseError extends NeuronCoreError {
    constructor(message, operation = null) {
        super(message, 'DATABASE_ERROR', 500);
        this.operation = operation;
    }
}

/**
 * AI instance related errors
 */
class AIInstanceError extends NeuronCoreError {
    constructor(message, aiName = null) {
        super(message, 'AI_INSTANCE_ERROR', 503);
        this.aiName = aiName;
    }
}

/**
 * SNL command related errors
 */
class SNLError extends NeuronCoreError {
    constructor(message, command = null) {
        super(message, 'SNL_ERROR', 400);
        this.command = command;
    }
}

/**
 * Not found errors
 */
class NotFoundError extends NeuronCoreError {
    constructor(message, resource = null) {
        super(message, 'NOT_FOUND', 404);
        this.resource = resource;
    }
}

/**
 * Rate limiting errors
 */
class RateLimitError extends NeuronCoreError {
    constructor(message, limit = null) {
        super(message, 'RATE_LIMIT', 429);
        this.limit = limit;
    }
}

/**
 * Error Handler utility class
 */
class ErrorHandler {
    /**
     * Express middleware for error handling
     */
    static middleware(error, req, res, next) {
        // If response was already sent, delegate to default Express error handler
        if (res.headersSent) {
            return next(error);
        }

        // Log error details
        console.error('Error occurred:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Handle known NeuronCore errors
        if (error instanceof NeuronCoreError) {
            return res.status(error.statusCode).json({
                error: true,
                code: error.code,
                message: error.message,
                timestamp: error.timestamp,
                ...(error.field && { field: error.field }),
                ...(error.operation && { operation: error.operation }),
                ...(error.aiName && { aiName: error.aiName }),
                ...(error.command && { command: error.command }),
                ...(error.resource && { resource: error.resource }),
                ...(error.limit && { limit: error.limit })
            });
        }

        // Handle validation errors from joi or similar libraries
        if (error.name === 'ValidationError' && error.details) {
            return res.status(400).json({
                error: true,
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                code: 'INVALID_TOKEN',
                message: 'Invalid or malformed token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                code: 'TOKEN_EXPIRED',
                message: 'Token has expired'
            });
        }

        // Handle syntax errors (malformed JSON, etc.)
        if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
            return res.status(400).json({
                error: true,
                code: 'MALFORMED_JSON',
                message: 'Request body contains malformed JSON'
            });
        }

        // Handle generic errors
        const isDevelopment = process.env.NODE_ENV === 'development';

        return res.status(500).json({
            error: true,
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            ...(isDevelopment && { stack: error.stack })
        });
    }

    /**
     * Create and throw a configuration error
     * @param {string} message - Error message
     */
    static configurationError(message) {
        throw new ConfigurationError(message);
    }

    /**
     * Create and throw an authentication error
     * @param {string} message - Error message
     */
    static authenticationError(message) {
        throw new AuthenticationError(message);
    }

    /**
     * Create and throw an authorization error
     * @param {string} message - Error message
     */
    static authorizationError(message) {
        throw new AuthorizationError(message);
    }

    /**
     * Create and throw a validation error
     * @param {string} message - Error message
     * @param {string} field - Field name
     */
    static validationError(message, field = null) {
        throw new ValidationError(message, field);
    }

    /**
     * Create and throw a database error
     * @param {string} message - Error message
     * @param {string} operation - Database operation
     */
    static databaseError(message, operation = null) {
        throw new DatabaseError(message, operation);
    }

    /**
     * Create and throw an AI instance error
     * @param {string} message - Error message
     * @param {string} aiName - AI instance name
     */
    static aiInstanceError(message, aiName = null) {
        throw new AIInstanceError(message, aiName);
    }

    /**
     * Create and throw an SNL error
     * @param {string} message - Error message
     * @param {string} command - SNL command
     */
    static snlError(message, command = null) {
        throw new SNLError(message, command);
    }

    /**
     * Create and throw a not found error
     * @param {string} message - Error message
     * @param {string} resource - Resource type
     */
    static notFoundError(message, resource = null) {
        throw new NotFoundError(message, resource);
    }

    /**
     * Create and throw a rate limit error
     * @param {string} message - Error message
     * @param {Object} limit - Rate limit info
     */
    static rateLimitError(message, limit = null) {
        throw new RateLimitError(message, limit);
    }

    /**
     * Wrap async functions to catch errors
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Wrapped function
     */
    static wrapAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

module.exports = {
    NeuronCoreError,
    ConfigurationError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    DatabaseError,
    AIInstanceError,
    SNLError,
    NotFoundError,
    RateLimitError,
    ErrorHandler
};