const Joi = require('joi');

exports.validateAgreement = Joi.object({
  category_id: Joi.string().required(),
  title: Joi.string().trim().required(),
  termsText: Joi.string().required(),
  version: Joi.string().optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  region: Joi.string().valid("Berlin", "Thessaloniki").required(),
});
