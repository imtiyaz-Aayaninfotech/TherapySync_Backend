const Joi = require('joi');

const coachingEnquirySchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'string.empty': 'User ID is required.',
      'any.required': 'User ID is required.',
    }),

  category_id: Joi.string().optional(),

  organisation: Joi.string()
    .required()
    .messages({
      'string.empty': 'Organisation is required.',
    }),

  message: Joi.string()
    .allow('')
    .optional(),
});

module.exports = { coachingEnquirySchema };