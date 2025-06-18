// src/utils/validators.js
const Joi = require('joi');

const validators = {
  email: Joi.string().email().required(),

  password: Joi.string().min(8).required(),

  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    nick: Joi.string().optional(),
    role: Joi.string().valid('default', 'admin').optional()
  }),

  plan: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    features: Joi.array().items(Joi.string()).optional(),
    limits: Joi.object().optional(),
    active: Joi.boolean().optional()
  }),

  subscription: Joi.object({
    userEmail: Joi.string().email().required(),
    plan: Joi.string().required(),
    userCount: Joi.number().min(1).optional(),
    authorizedBy: Joi.string().email().required()
  }),

  permission: Joi.object({
    email: Joi.string().email().required(),
    database: Joi.string().required(),
    level: Joi.number().valid(1, 2, 3).required()
  })
};

module.exports = validators;