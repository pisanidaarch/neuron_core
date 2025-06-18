// src/api/middlewares/auth.js
const authenticationService = require('../../core/security/authentication.service');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7);
    const validation = await authenticationService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        error: validation.error || 'Invalid token'
      });
    }

    req.user = {
      email: validation.email,
      permissions: validation.permissions
    };
    req.token = token;

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed'
    });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    // This middleware should be used after authMiddleware
    if (!req.token) {
      return res.status(401).json({
        error: 'No authentication token found'
      });
    }

    const permissionManager = require('../../data/managers/permission.manager');
    const isAdmin = await permissionManager.isAdmin(req.token);

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    res.status(403).json({
      error: 'Admin validation failed'
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};