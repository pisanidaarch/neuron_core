// src/cross/entity/errors.js

/**
 * Base Error class for NeuronCore
 */
class NeuronCoreError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Authentication Error - 401
 */
class AuthenticationError extends NeuronCoreError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

/**
 * Authorization Error - 403
 */
class AuthorizationError extends NeuronCoreError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}

/**
 * Validation Error - 400
 */
class ValidationError extends NeuronCoreError {
    constructor(message = 'Validation failed') {
        super(message, 400);
    }
}

/**
 * Not Found Error - 404
 */
class NotFoundError extends NeuronCoreError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * Conflict Error - 409
 */
class ConflictError extends NeuronCoreError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}

/**
 * NeuronDB Error - Database related errors
 */
class NeuronDBError extends NeuronCoreError {
    constructor(message = 'Database operation failed') {
        super(message, 500);
    }
}

/**
 * Security Error - Security related errors
 */
class SecurityError extends NeuronCoreError {
    constructor(message = 'Security violation') {
        super(message, 403);
    }
}

/**
 * Configuration Error - Configuration related errors
 */
class ConfigurationError extends NeuronCoreError {
    constructor(message = 'Configuration error') {
        super(message, 500);
    }
}

/**
 * Rate Limit Error - 429
 */
class RateLimitError extends NeuronCoreError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429);
    }
}

/**
 * Service Unavailable Error - 503
 */
class ServiceUnavailableError extends NeuronCoreError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503);
    }
}

/**
 * Error Handler Utility
 */
class ErrorHandler {
    /**
     * Handle errors in Express middleware
     * @param {Error} error - Error object
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Express next function
     */
    static handleError(error, req, res, next) {
        // Log error for debugging
        console.error('Error occurred:', {
            message: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Handle known error types
        if (error instanceof NeuronCoreError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message,
                type: error.name
            });
        }

        // Handle validation errors from other libraries
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: true,
                message: error.message,
                type: 'ValidationError'
            });
        }

        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                message: 'Invalid token',
                type: 'AuthenticationError'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: 'Token expired',
                type: 'AuthenticationError'
            });
        }

        // Handle syntax errors
        if (error instanceof SyntaxError) {
            return res.status(400).json({
                error: true,
                message: 'Invalid JSON in request body',
                type: 'ValidationError'
            });
        }

        // Default error handler
        res.status(500).json({
            error: true,
            message: 'Internal server error',
            type: 'InternalServerError'
        });
    }

    /**
     * Async error wrapper for route handlers
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Wrapped function
     */
    static asyncWrapper(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Create error response object
     * @param {string} message - Error message
     * @param {string} type - Error type
     * @param {number} statusCode - HTTP status code
     * @returns {Object}
     */
    static createErrorResponse(message, type = 'Error', statusCode = 500) {
        return {
            error: true,
            message,
            type,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create success response object
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @returns {Object}
     */
    static createSuccessResponse(data, message = 'Success') {
        return {
            error: false,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    NeuronCoreError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    ConflictError,
    NeuronDBError,
    SecurityError,
    ConfigurationError,
    RateLimitError,
    ServiceUnavailableError,
    ErrorHandler
};