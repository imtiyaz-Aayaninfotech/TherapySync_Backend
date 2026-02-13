const Joi = require("joi");

exports.categoryValidation = Joi.object({
  category: Joi.string()
    .valid(
      "Individual Therapy",
      "Couples Counseling",
      "Family Therapy",
      "Group Therapy",
      "Executive Coaching",
      "Couples Therapy",
      "Other"
    )
    .required()
    .messages({
      "any.only": "Invalid category type selected.",
      "any.required": "Category is required.",
    }),

  type: Joi.string()
    .valid("1-on-1", "Group", "Online", "Hybrid", "Other")
    .required()
    .messages({
      "any.only": "Invalid session type selected.",
      "any.required": "Type is required.",
    }),

  aboutTherapy: Joi.string()
    .required()
    .messages({
      "any.required": "About therapy is required.",
    }),

  workingTime: Joi.object({
    start: Joi.string().required().messages({
      "any.required": "Working start time is required.",
    }),
    end: Joi.string().required().messages({
      "any.required": "Working end time is required.",
    }),
  }).required(),

  image: Joi.string().uri().optional().allow(null, ""),

  video: Joi.string().uri().optional().allow(null, ""),

  status: Joi.string()
    .valid("active", "inactive")
    .optional()
});
