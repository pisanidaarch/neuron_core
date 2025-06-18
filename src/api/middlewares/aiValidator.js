// src/api/middlewares/aiValidator.js
const ConfigVO = require('../../cross/entities/config.vo');
const { ERRORS } = require('../../cross/constants');

const aiValidator = (req, res, next) => {
  try {
    // Extract AI name from URL (first parameter after /api/)
    const pathParts = req.path.split('/').filter(Boolean);
    
    // Expected pattern: /api/{aiName}/...
    if (pathParts.length < 2 || pathParts[0] !== 'api') {
      return res.status(400).json({
        error: 'Invalid API path format. Expected: /api/{aiName}/...',
        data: null
      });
    }

    const aiName = pathParts[1];

    if (!aiName) {
      return res.status(400).json({
        error: 'AI name is required in the URL path',
        data: null
      });
    }

    // Get singleton instance
    const config = new ConfigVO();

    // Validate AI exists and is configured
    if (!config.hasAI(aiName)) {
      return res.status(404).json({
        error: `${ERRORS.INVALID_AI}: ${aiName}`,
        data: {
          availableAIs: config.getAllAIs()
        }
      });
    }

    // Attach AI information to request
    req.aiName = aiName;
    req.aiToken = config.getAIToken(aiName);

    // Adjust the URL for routing - remove /api/{aiName}
    req.url = req.url.replace(`/api/${aiName}`, '');
    
    // If URL becomes empty, set to root
    if (!req.url || req.url === '') {
      req.url = '/';
    }

    console.log(`✓ AI validated: ${aiName}`);
    next();
  } catch (error) {
    console.error('AI validation error:', error);
    res.status(500).json({
      error: 'Internal server error during AI validation',
      data: null
    });
  }
};

module.exports = aiValidator;