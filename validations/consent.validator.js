const Joi = require('joi');

// ✅ CREATE Consent Validation
exports.validateConsent = Joi.object({
  category_id: Joi.string().required().messages({
    "any.required": "Category is required."
  }),

  title: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Title is required."
    }),

  termsText: Joi.string()
    .required()
    .messages({
      "any.required": "Terms text is required."
    }),

  version: Joi.string().optional(),

  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
    .messages({
      "any.only": "Status must be active or inactive."
    })
});


// ✅ UPDATE Consent Validation (All optional)
exports.validateConsentUpdate = Joi.object({
  category_id: Joi.string().optional(),

  title: Joi.string().trim().optional(),

  termsText: Joi.string().optional(),

  version: Joi.string().optional(),

  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
});
