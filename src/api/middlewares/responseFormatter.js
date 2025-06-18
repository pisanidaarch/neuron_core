// src/api/middlewares/responseFormatter.js
const responseFormatter = (req, res, next) => {
  // Success response helper
  res.success = (data = null, message = 'Success') => {
    const response = {
      message,
      ...(data && { data })
    };

    return res.json(response);
  };

  // Error response helper
  res.error = (message = 'Error', status = 400) => {
    return res.status(status).json({
      error: message
    });
  };

  next();
};

module.exports = responseFormatter;