// src/cross/entity/errors.js

/**
 * Custom Error Classes for NeuronCore
 */

/**
 * Base NeuronCore Error
 */
class NeuronCoreError extends Error {
    constructor(message, code = 'NEURON_CORE_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Authentication Error
 */
class AuthenticationError extends NeuronCoreError {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTHENTICATION_ERROR');
    }
}

/**
 * Authorization Error
 */
class AuthorizationError extends NeuronCoreError {
    constructor(message = 'Authorization failed') {
        super(message, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Validation Error
 */
class ValidationError extends NeuronCoreError {
    constructor(message = 'Validation failed', field = null) {
        super(message, 'VALIDATION_ERROR');
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
 * Not Found Error
 */
class NotFoundError extends NeuronCoreError {
    constructor(message = 'Resource not found', resource = null) {
        super(message, 'NOT_FOUND_ERROR');
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
 * NeuronDB Error
 */
class NeuronDBError extends NeuronCoreError {
    constructor(message = 'Database operation failed') {
        super(message, 'NEURON_DB_ERROR');
    }
}

/**
 * Configuration Error
 */
class ConfigurationError extends NeuronCoreError {
    constructor(message = 'Configuration error') {
        super(message, 'CONFIGURATION_ERROR');
    }
}

/**
 * Permission Error
 */
class PermissionError extends NeuronCoreError {
    constructor(message = 'Permission denied', permission = null) {
        super(message, 'PERMISSION_ERROR');
        this.permission = permission;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            permission: this.permission
        };
    }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends NeuronCoreError {
    constructor(message = 'Rate limit exceeded', retryAfter = null) {
        super(message, 'RATE_LIMIT_ERROR');
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
 * SNL Error
 */
class SNLError extends NeuronCoreError {
    constructor(message = 'SNL operation failed', command = null) {
        super(message, 'SNL_ERROR');
        this.command = command;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            command: this.command
        };
    }
}

/**
 * Token Error
 */
class TokenError extends NeuronCoreError {
    constructor(message = 'Token error') {
        super(message, 'TOKEN_ERROR');
    }
}

/**
 * Error Handler Utility
 */
class ErrorHandler {
    /**
     * Async wrapper for Express routes
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Express middleware function
     */
    static asyncWrapper(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Global error handler middleware
     * @param {Error} error - Error object
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Express next function
     */
    static handleError(error, req, res, next) {
        // Log error
        console.error('Error occurred:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Set default error response
        let statusCode = 500;
        let errorResponse = {
            error: true,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        };

        // Handle specific error types
        if (error instanceof ValidationError) {
            statusCode = 400;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                field: error.field,
                timestamp: error.timestamp
            };
        } else if (error instanceof AuthenticationError) {
            statusCode = 401;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                timestamp: error.timestamp
            };
        } else if (error instanceof AuthorizationError || error instanceof PermissionError) {
            statusCode = 403;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                timestamp: error.timestamp
            };
        } else if (error instanceof NotFoundError) {
            statusCode = 404;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                resource: error.resource,
                timestamp: error.timestamp
            };
        } else if (error instanceof RateLimitError) {
            statusCode = 429;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                retryAfter: error.retryAfter,
                timestamp: error.timestamp
            };
        } else if (error instanceof NeuronCoreError) {
            // Generic NeuronCore error
            statusCode = 500;
            errorResponse = {
                error: true,
                message: error.message,
                code: error.code,
                timestamp: error.timestamp
            };
        }

        // Add debug info in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
            errorResponse.url = req.url;
            errorResponse.method = req.method;
        }

        res.status(statusCode).json(errorResponse);
    }

    /**
     * Create error response object
     * @param {Error} error - Error object
     * @param {Object} additionalInfo - Additional info to include
     * @returns {Object} Error response
     */
    static createErrorResponse(error, additionalInfo = {}) {
        const baseResponse = {
            error: true,
            message: error.message || 'An error occurred',
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString()
        };

        return { ...baseResponse, ...additionalInfo };
    }

    /**
     * Create success response object
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @returns {Object} Success response
     */
    static createSuccessResponse(data, message = 'Operation successful') {
        return {
            error: false,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate required fields
     * @param {Object} data - Data to validate
     * @param {Array} requiredFields - Array of required field names
     * @throws {ValidationError} If validation fails
     */
    static validateRequiredFields(data, requiredFields) {
        const missing = requiredFields.filter(field =>
            data[field] === undefined || data[field] === null || data[field] === ''
        );

        if (missing.length > 0) {
            throw new ValidationError(
                `Missing required fields: ${missing.join(', ')}`,
                missing[0]
            );
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @throws {ValidationError} If email is invalid
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format', 'email');
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @param {number} minLength - Minimum length
     * @throws {ValidationError} If password is weak
     */
    static validatePassword(password, minLength = 6) {
        if (!password || password.length < minLength) {
            throw new ValidationError(
                `Password must be at least ${minLength} characters long`,
                'password'
            );
        }
    }
}

module.exports = {
    // Error classes
    NeuronCoreError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    NeuronDBError,
    ConfigurationError,
    PermissionError,
    RateLimitError,
    SNLError,
    TokenError,

    // Utility class
    ErrorHandler
};