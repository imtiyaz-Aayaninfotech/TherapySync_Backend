const Joi = require('joi');

exports.validateConsent = Joi.object({
  category_id: Joi.string().required(),
  title: Joi.string().trim().required(),
  termsText: Joi.string().required(),
  version: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  region: Joi.string().valid("Berlin", "Thessaloniki").required(),
});

// ✅ For UPDATE: all fields optional
exports.validateConsentUpdate = Joi.object({
  category_id: Joi.string().optional(),
  title: Joi.string().trim().optional(),
  termsText: Joi.string().optional(),
  version: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  region: Joi.string().valid("Berlin", "Thessaloniki").optional(),
});