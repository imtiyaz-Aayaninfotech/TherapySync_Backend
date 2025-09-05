// const Joi = require('joi');
// const mongoose = require('mongoose');

// exports.validateUpdateUser = (req, res, next) => {
//   const schema = Joi.object({
//     name: Joi.string().trim().min(2).max(100),
//     email: Joi.string().email().lowercase(),
//     phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
//     gender: Joi.string().valid('Male', 'Female', 'Other'),
//     dateOfBirth: Joi.date(),
//     region: Joi.string().valid('Berlin', 'Thessaloniki'),
//     // image: Joi.string().uri(),
//   });

//   const { error } = schema.validate(req.body, { allowUnknown: true });

//   if (error) {
//     return res.status(400).json({ message: error.details[0].message });
//   }

//   next();
// };

// exports.validateObjectId = (req, res, next) => {
//   const { id } = req.params;
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid user ID format' });
//   }
//   next();
// };

const Joi = require('joi');
const mongoose = require('mongoose');

// Register Validation Schema
exports.validateRegisterUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(50) // Increased max length for more real-world emails
      .required()
      .messages({
        'string.email': 'Please enter a valid email address.',
        'string.max': 'Email must be at most 50 characters.',
        'any.required': 'Email is required.',
      }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters.',
      'any.required': 'Password is required.',
    }),
    name: Joi.string()
      .trim()
      .max(50)  // Increased max length for names with multiple parts
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.max': 'Name must be at most 50 characters.',
        'string.pattern.base': 'Name must only contain letters and spaces.',
        'any.required': 'Name is required.',
      }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .allow('', null) // Allow empty string or null to make optional
      .messages({
        'string.pattern.base': 'Phone number must be 7 to 15 digits.',
      }),
    gender: Joi.string()
      .valid('Male', 'Female', 'Other')
      .allow('', null) // Optional field, allow empty
      .messages({
        'any.only': 'Gender must be one of Male, Female, or Other.',
      }),
    dateOfBirth: Joi.date()
      .allow(null) // Optional
      .max('now')  // Disallow future dates
      .messages({
        'date.max': 'Date of birth cannot be in the future.',
      }),
    region: Joi.string()
      .valid('Berlin', 'Thessaloniki', 'Athens', 'Hamburg', 'Other')
      .required()
      .messages({
        'any.only': 'Invalid region.',
        'any.required': 'Region is required.',
      }),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true, convert: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Update User Validation Schema
exports.validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        'string.min': 'Name must be at least 2 characters.',
        'string.max': 'Name must be at most 50 characters.',
        'string.pattern.base': 'Name must only contain letters and spaces.',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .messages({
        'string.email': 'Please enter a valid email address.',
      }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .allow('', null)
      .messages({
        'string.pattern.base': 'Phone number must be 7 to 15 digits.',
      }),
    gender: Joi.string()
      .valid('Male', 'Female', 'Other')
      .allow('', null)
      .messages({
        'any.only': 'Gender must be one of Male, Female, or Other.',
      }),
    dateOfBirth: Joi.date()
      .allow(null)
      .max('now')
      .messages({
        'date.max': 'Date of birth cannot be in the future.',
      }),
    region: Joi.string()
      .valid('Berlin', 'Thessaloniki', 'Athens', 'Hamburg', 'Other')
      .messages({
        'any.only': 'Invalid region.',
      }),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true, convert: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Object ID Validator
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }
  next();
};
