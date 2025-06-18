// src/api/middlewares/aiValidator.js
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

const aiValidator = (req, res, next) => {
  try {
    // Extract AI name from URL (first parameter after base path)
    const pathParts = req.path.split('/').filter(Boolean);
    const aiName = pathParts[0];

    if (!aiName) {
      return res.status(400).json({
        error: 'AI name is required in the URL path'
      });
    }

    // Get AI configurations from cache
    const aiKeys = ConfigVO.get('AI_KEYS');

    if (!aiKeys) {
      return res.status(503).json({
        error: 'AI configurations not loaded yet'
      });
    }

    if (!aiKeys.hasAI(aiName)) {
      return res.status(404).json({
        error: ERRORS.INVALID_AI
      });
    }

    // Attach AI name to request for use in controllers
    req.aiName = aiName;
    req.aiToken = aiKeys.getToken(aiName);

    // Adjust the URL for routing
    req.url = req.url.replace(`/${aiName}`, '');

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = aiValidator;