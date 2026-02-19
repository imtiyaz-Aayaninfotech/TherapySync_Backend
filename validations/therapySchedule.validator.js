const Joi = require("joi");

const sessionSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  start: Joi.string().required(),
  end: Joi.string().required()
});

exports.scheduleValidator = Joi.object({
  category_id: Joi.string().required(),
  user: Joi.string().required(),
  sessionPlan: Joi.string().valid("single", "package").required(),
  sessions: Joi.array().items(sessionSchema).required(),
  // price: Joi.number().required(),
  notes: Joi.string().optional(),
  // region: Joi.string().valid("Berlin", "Thessaloniki").required(),
});
