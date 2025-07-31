const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: Number,
  text: {
    en: String,
    de: String,
  },
  category: {
    en: String,
    de: String,
  }
});

const questionnaireSchema = new mongoose.Schema({
  name: {
    en: String,
    de: String
  },
  instructions: {
    en: String,
    de: String
  },
  responseFormat: {
    frequency: {
      en: [String],
      de: [String]
    },
    intensity: {
      en: [String],
      de: [String]
    }
  },
  questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
