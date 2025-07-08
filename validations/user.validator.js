const Joi = require('joi');
const mongoose = require('mongoose');

exports.validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email().lowercase(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    dateOfBirth: Joi.date(),
    reason: Joi.string().valid('Berlin', 'Thessaloniki'),
    // image: Joi.string().uri(),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }
  next();
};
