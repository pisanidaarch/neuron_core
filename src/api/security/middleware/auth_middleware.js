// src/api/security/middleware/auth_middleware.js

const NeuronDBSender = require('../../../data/neuron_db/sender');
const { AuthenticationError, AuthorizationError } = require('../../../cross/entity/errors');

/**
 * Authentication Middleware for NeuronCore
 */
class AuthMiddleware {
    constructor() {
        this.sender = new NeuronDBSender();
    }

    /**
     * Validate token middleware
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    async validateToken(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                throw new AuthenticationError('Token is required');
            }

            // Validate token
            const userInfo = await this.sender.validateToken(token);

            // Add user info to request
            req.user = userInfo;
            req.token = token;

            next();
        } catch (error) {
            console.error('Token validation error:', error);

            res.status(401).json({
                error: true,
                message: 'Invalid or expired token'
            });
        }
    }

    /**
     * Require admin permissions middleware
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    async requireAdmin(req, res, next) {
        try {
            if (!req.user) {
                throw new AuthenticationError('User authentication required');
            }

            // Check if user has admin permissions
            const isAdmin = req.user.groups?.includes('admin') ||
                           req.user.permissions?.some(p => p.database === 'main' && p.level >= 3);

            if (!isAdmin) {
                throw new AuthorizationError('Admin permissions required');
            }

            next();
        } catch (error) {
            console.error('Admin authorization error:', error);

            res.status(403).json({
                error: true,
                message: error.message
            });
        }
    }

    /**
     * Require subscription admin permissions middleware
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    async requireSubscriptionAdmin(req, res, next) {
        try {
            if (!req.user) {
                throw new AuthenticationError('User authentication required');
            }

            // Check if user is subscription_admin or regular admin
            const isSubscriptionAdmin = req.user.username === 'subscription_admin' ||
                                       req.user.sub === 'subscription_admin@system.local';
            const isAdmin = req.user.groups?.includes('admin') ||
                           req.user.permissions?.some(p => p.database === 'main' && p.level >= 3);

            if (!isSubscriptionAdmin && !isAdmin) {
                throw new AuthorizationError('Subscription admin permissions required');
            }

            next();
        } catch (error) {
            console.error('Subscription admin authorization error:', error);

            res.status(403).json({
                error: true,
                message: error.message
            });
        }
    }

    /**
     * Require specific permission middleware
     * @param {string} permission - Required permission
     * @param {string} resource - Resource context (optional)
     * @returns {Function} Middleware function
     */
    requirePermission(permission, resource = null) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AuthenticationError('User authentication required');
                }

                const hasPermission = this.checkUserPermission(req.user, permission, resource);

                if (!hasPermission) {
                    throw new AuthorizationError(`Permission required: ${permission}`);
                }

                next();
            } catch (error) {
                console.error('Permission authorization error:', error);

                res.status(403).json({
                    error: true,
                    message: error.message
                });
            }
        };
    }

    /**
     * Check if user has specific permission
     * @param {Object} userInfo - User information
     * @param {string} permission - Permission to check
     * @param {string} resource - Resource context
     * @returns {boolean}
     */
    checkUserPermission(userInfo, permission, resource) {
        // Admins have all permissions
        if (userInfo.groups?.includes('admin')) {
            return true;
        }

        // Check direct permissions
        if (userInfo.permissions) {
            const hasDirectPermission = userInfo.permissions.some(p => {
                if (p.permission === permission || p.permission === '*') {
                    if (!resource) return true;
                    return p.resource === resource || p.resource === '*';
                }
                return false;
            });

            if (hasDirectPermission) return true;
        }

        // Check group-based permissions
        const permissionMap = {
            'subscription_admin': [
                'subscription.create',
                'subscription.cancel',
                'subscription.change_plan',
                'subscription.manage'
            ],
            'admin': ['*'],
            'default': [
                'ai.use',
                'user.profile.edit',
                'timeline.view',
                'config.view'
            ]
        };

        if (userInfo.groups) {
            for (const group of userInfo.groups) {
                const groupPermissions = permissionMap[group] || [];
                const hasGroupPermission = groupPermissions.some(p => {
                    if (p === '*') return true;
                    if (p.endsWith('*')) {
                        return permission.startsWith(p.slice(0, -1));
                    }
                    return p === permission;
                });

                if (hasGroupPermission) return true;
            }
        }

        return false;
    }

    /**
     * Allow self or admin middleware
     * @param {string} userParam - Parameter name containing username
     * @returns {Function} Middleware function
     */
    allowSelfOrAdmin(userParam = 'username') {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    throw new AuthenticationError('User authentication required');
                }

                const targetUser = req.params[userParam];
                const isSelf = req.user.username === targetUser || req.user.email === targetUser;
                const isAdmin = req.user.groups?.includes('admin') ||
                               req.user.permissions?.some(p => p.database === 'main' && p.level >= 3);

                if (!isSelf && !isAdmin) {
                    throw new AuthorizationError('You can only access your own data or need admin permissions');
                }

                next();
            } catch (error) {
                console.error('Self or admin authorization error:', error);

                res.status(403).json({
                    error: true,
                    message: error.message
                });
            }
        };
    }

    /**
     * Rate limiting middleware (basic implementation)
     * @param {number} maxRequests - Max requests per window
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Function} Middleware function
     */
    rateLimit(maxRequests = 100, windowMs = 60000) {
        const requests = new Map();

        return (req, res, next) => {
            const key = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old entries
            const userRequests = requests.get(key) || [];
            const validRequests = userRequests.filter(time => time > windowStart);

            if (validRequests.length >= maxRequests) {
                return res.status(429).json({
                    error: true,
                    message: 'Too many requests, please try again later',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            validRequests.push(now);
            requests.set(key, validRequests);

            next();
        };
    }

    /**
     * CORS middleware for AI-specific endpoints
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    cors(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    }

    /**
     * Log request middleware
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    logRequest(req, res, next) {
        const startTime = Date.now();
        const originalSend = res.send;

        res.send = function(data) {
            const duration = Date.now() - startTime;

            console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - User: ${req.user?.username || 'anonymous'}`);

            originalSend.call(this, data);
        };

        next();
    }

    /**
     * Validate AI name middleware
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     * @param {Function} next - Next middleware function
     */
    async validateAIName(req, res, next) {
        try {
            const { aiName } = req.params;

            if (!aiName || typeof aiName !== 'string') {
                throw new ValidationError('AI name is required');
            }

            // Validate AI name format
            const validAINamePattern = /^[a-zA-Z0-9_-]+$/;
            if (!validAINamePattern.test(aiName)) {
                throw new ValidationError('Invalid AI name format');
            }

            // TODO: Check if AI exists in KeysVO
            // For now, we'll just validate the format

            next();
        } catch (error) {
            console.error('AI name validation error:', error);

            res.status(400).json({
                error: true,
                message: error.message
            });
        }
    }
}

module.exports = AuthMiddleware;