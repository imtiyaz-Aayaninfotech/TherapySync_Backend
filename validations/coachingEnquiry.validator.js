const Joi = require('joi');

const coachingEnquirySchema = Joi.object({
  category_id: Joi.string().optional(),
  name: Joi.string()
    .pattern(/^[A-Za-z\s]+$/) // Only letters and spaces
    .required()
    .messages({
      'string.pattern.base': 'Name must not contain numbers or special characters.',
      'string.empty': 'Name is required.',
    }),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10,15}$/) // Only digits, length between 10 and 15
    .required()
    .messages({
      'string.pattern.base': 'Phone Number must be digits only, no special characters.',
      'string.empty': 'Phone Number is required.',
    }),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  organisation: Joi.string().required(),
});
module.exports = { coachingEnquirySchema };
