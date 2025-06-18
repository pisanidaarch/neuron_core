// src/api/middlewares/errorHandler.js
const ConfigVO = require('../../cross/entities/config.vo');

const errorHandler = (error, req, res, next) => {
  console.error('Error caught by errorHandler:', error);

  // Default error
  let status = 500;
  let message = 'Internal server error';
  let data = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
    data = { details: error.message };
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized access';
  } else if (error.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden access';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
  } else if (error.message.includes('AI configuration')) {
    status = 503;
    message = 'Service configuration error';
    data = { details: error.message };
  } else if (error.message.includes('Invalid AI')) {
    status = 404;
    message = 'Invalid AI name specified';
    data = {
      details: error.message,
      availableAIs: new ConfigVO().getAllAIs()
    };
  } else if (error.message.includes('Permission denied') || error.message.includes('Admin privileges')) {
    status = 403;
    message = 'Insufficient permissions';
    data = { details: error.message };
  } else if (error.message.includes('Token') || error.message.includes('Authorization')) {
    status = 401;
    message = 'Authentication required';
    data = { details: error.message };
  } else if (error.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service unavailable - Database connection failed';
  } else if (error.code === 'ETIMEDOUT') {
    status = 504;
    message = 'Service timeout';
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error stack:', error.stack);
    data = data || { stack: error.stack };
  }

  // Send standardized error response
  res.status(status).json({
    error: message,
    data: data
  });
};

module.exports = errorHandler;