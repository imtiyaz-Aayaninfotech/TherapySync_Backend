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

// ✅ Register Validation Schema
exports.validateRegisterUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(30)
      .required()
      .messages({
        'string.email': 'Please enter a valid email address.',
        'string.max': 'Email must be at most 30 characters.',
        'any.required': 'Email is required.',
      }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters.',
      'any.required': 'Password is required.',
    }),
    name: Joi.string()
      .max(30)
      .pattern(/^[a-zA-Z ]+$/)
      .required()
      .messages({
        'string.max': 'Name must be at most 30 characters.',
        'string.pattern.base': 'Name must only contain letters and spaces (no numbers or special characters).',
        'any.required': 'Name is required.',
      }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be 7 to 15 digits.',
        'any.required': 'Phone number is required.',
      }),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    dateOfBirth: Joi.date().optional(),
    region: Joi.string()
      .valid('Berlin', 'Thessaloniki', 'Athens', 'Hamburg', 'Other')
      .required(),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

// ✅ For update user (already existing)
exports.validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email().lowercase(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    dateOfBirth: Joi.date(),
    region: Joi.string().valid('Berlin', 'Thessaloniki'),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

// ✅ Object ID Validator
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }
  next();
};
