const Joi = require("joi");

exports.createQuestionnaireSchema = Joi.object({
  name: Joi.object({ en: Joi.string().required(), de: Joi.string().required() }),
  instructions: Joi.object({ en: Joi.string().required(), de: Joi.string().required() }),
  responseFormat: Joi.object({
    frequency: Joi.object({ en: Joi.array().items(Joi.string()), de: Joi.array().items(Joi.string()) }),
    intensity: Joi.object({ en: Joi.array().items(Joi.string()), de: Joi.array().items(Joi.string()) })
  }),
  questions: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    text: Joi.object({ en: Joi.string().required(), de: Joi.string().required() }),
    category: Joi.object({ en: Joi.string().required(), de: Joi.string().required() })
  }))
});