const Joi = require("joi");
exports.submitResponseSchema = Joi.object({
  questionnaireId: Joi.string().required(),
  userId: Joi.string().required(),
  language: Joi.string().valid("en", "de").default("en"),
  answers: Joi.array().items(Joi.object({
    questionId: Joi.number().required(),
    frequency: Joi.string().required(),
    intensity: Joi.string().required()
  }))
});