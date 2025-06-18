// src/api/middlewares/auth.middleware.js
const authenticationService = require('../../core/security/authentication.service');
const permissionService = require('../../core/security/permission.service');
const { ERRORS } = require('../../cross/constants');

/**
 * Middleware para verificar se o usuário está autenticado
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const { aiName } = req;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
        data: null
      });
    }

    const token = authHeader.substring(7);

    // Validate token
    const validation = await authenticationService.validateToken(aiName, token);

    if (!validation.valid) {
      return res.status(401).json({
        error: validation.error || ERRORS.INVALID_TOKEN,
        data: null
      });
    }

    // Attach user info to request
    req.user = {
      email: validation.email,
      permissions: validation.permissions,
      token: token
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: `Authentication failed: ${error.message}`,
      data: null
    });
  }
};

/**
 * Middleware para verificar se o usuário tem privilégios de admin
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const { aiName, user } = req;

    if (!user || !user.token) {
      return res.status(401).json({
        error: 'Authentication required',
        data: null
      });
    }

    const isAdmin = await permissionService.isAdmin(aiName, user.token);

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin privileges required',
        data: null
      });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    res.status(403).json({
      error: `Admin verification failed: ${error.message}`,
      data: null
    });
  }
};

/**
 * Middleware para verificar permissão específica em um banco
 */
const permissionMiddleware = (database, requiredLevel) => {
  return async (req, res, next) => {
    try {
      const { aiName, user } = req;

      if (!user || !user.token) {
        return res.status(401).json({
          error: 'Authentication required',
          data: null
        });
      }

      const hasPermission = await permissionService.hasPermission(
        aiName,
        user.token,
        database,
        requiredLevel
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: `Insufficient permissions for ${database}`,
          data: null
        });
      }

      next();
    } catch (error) {
      res.status(403).json({
        error: `Permission verification failed: ${error.message}`,
        data: null
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário pode acessar um recurso específico
 * (próprio email ou admin)
 */
const resourceOwnerMiddleware = (emailParam = 'email') => {
  return async (req, res, next) => {
    try {
      const { aiName, user } = req;
      const targetEmail = req.params[emailParam] || req.body[emailParam];

      if (!user || !user.token) {
        return res.status(401).json({
          error: 'Authentication required',
          data: null
        });
      }

      // User can access their own resources
      if (user.email === targetEmail) {
        return next();
      }

      // Or if they are admin
      const isAdmin = await permissionService.isAdmin(aiName, user.token);

      if (isAdmin) {
        req.user.isAdmin = true;
        return next();
      }

      return res.status(403).json({
        error: 'Access denied: You can only access your own resources',
        data: null
      });
    } catch (error) {
      res.status(403).json({
        error: `Resource access verification failed: ${error.message}`,
        data: null
      });
    }
  };
};

/**
 * Middleware opcional de autenticação (não falha se não autenticado)
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const { aiName } = req;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No authentication provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Try to validate token
    const validation = await authenticationService.validateToken(aiName, token);

    if (validation.valid) {
      req.user = {
        email: validation.email,
        permissions: validation.permissions,
        token: token
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // On error, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  permissionMiddleware,
  resourceOwnerMiddleware,
  optionalAuthMiddleware
};