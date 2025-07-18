const Joi = require("joi");

exports.helpSupportUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
  message: Joi.string().min(5).max(1000),
  status: Joi.string().valid("pending", "in_progress", "resolved")
});
