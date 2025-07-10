const Joi = require("joi");

exports.categoryValidation = Joi.object({
  category: Joi.string()
    .valid(
      "Individual Therapy",
      "Couples Counseling",
      "Family Therapy",
      "Group Therapy",
      "Other"
    )
    .required(),
  type: Joi.string()
    .valid("1-on-1", "Group", "Online", "Hybrid", "Other")
    .required(),
  aboutTherapy: Joi.string().required(),
  workingTime: Joi.object({
    start: Joi.string().required(),
    end: Joi.string().required(),
  }).required(),
  image: Joi.string().uri().optional().allow(null, ""),
  video: Joi.string().uri().optional().allow(null, ""),
  status: Joi.string().valid("active", "inactive").optional(),
  reason: Joi.string().valid("Berlin", "Thessaloniki").required(),
});
