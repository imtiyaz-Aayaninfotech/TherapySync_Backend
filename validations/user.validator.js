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

// ✅ Country List (Single Source of Truth)
const allowedCountries = [
  'UK',
  'Ireland',
  'Luxembourg',
  'Latvia',
  'Hungary',
  'Bulgaria',
  'Cyprus',
  'Romania',
  'Poland',
  'Czech Republic',
  'Germany',
  'Greece'
];

const translateToGerman = (msg) => {
  const map = {
    'Please enter a valid email address.': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    'Email must be at most 50 characters.': 'E-Mail darf maximal 50 Zeichen lang sein.',
    'Email is required.': 'E-Mail ist erforderlich.',

    'Password must be at least 6 characters.': 'Passwort muss mindestens 6 Zeichen lang sein.',
    'Password is required.': 'Passwort ist erforderlich.',

    'Name must be at most 50 characters.': 'Name darf maximal 50 Zeichen lang sein.',
    'Name must only contain letters and spaces.': 'Name darf nur Buchstaben und Leerzeichen enthalten.',
    'Name is required.': 'Name ist erforderlich.',
    'Name must be at least 2 characters.': 'Name muss mindestens 2 Zeichen lang sein.',

    'Phone number must be 7 to 15 digits.': 'Telefonnummer muss 7 bis 15 Ziffern enthalten.',

    'Gender must be one of Male, Female, or Other.': 'Geschlecht muss Male, Female oder Other sein.',

    'Date of birth cannot be in the future.': 'Geburtsdatum darf nicht in der Zukunft liegen.',

    'Invalid country selected.': 'Ungültiges Land ausgewählt.',
    'Country is required.': 'Land ist erforderlich.',

    'Invalid user ID format': 'Ungültiges Benutzer-ID-Format'
  };

  return map[msg] || msg;
};

// ================= REGISTER VALIDATION =================
exports.validateRegisterUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(50)
      .required()
      .messages({
        'string.email': 'Please enter a valid email address.',
        'string.max': 'Email must be at most 50 characters.',
        'any.required': 'Email is required.',
      }),

    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters.',
        'any.required': 'Password is required.',
      }),

    name: Joi.string()
      .trim()
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.max': 'Name must be at most 50 characters.',
        'string.pattern.base': 'Name must only contain letters and spaces.',
        'any.required': 'Name is required.',
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

    // ✅ COUNTRY VALIDATION
    country: Joi.string()
      .valid(...allowedCountries)
      .required()
      .messages({
        'any.only': 'Invalid country selected.',
        'any.required': 'Country is required.',
      }),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true, convert: true });

 if (error) {
  const msg = error.details[0].message;

  return res.status(400).json({
    message: {
      en: msg,
      de: translateToGerman(msg)
    }
  });
}

  next();
};


// ================= UPDATE USER VALIDATION =================
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

    // ✅ COUNTRY (optional in update)
    country: Joi.string()
      .valid(...allowedCountries)
      .messages({
        'any.only': 'Invalid country selected.',
      }),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true, convert: true });

  if (error) {
  const msg = error.details[0].message;

  return res.status(400).json({
    message: {
      en: msg,
      de: translateToGerman(msg)
    }
  });
}

  next();
};


// ================= OBJECT ID VALIDATOR =================
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    message: {
      en: 'Invalid user ID format',
      de: translateToGerman('Invalid user ID format')
    }
  });
}

  next();
};
