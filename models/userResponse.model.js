const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: Number,
  frequency: String, // could use enum
  intensity: String
});

const userResponseSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  questionnaireId: mongoose.Schema.Types.ObjectId,
  answers: [answerSchema],
  language: { type: String, enum: ['en', 'de'], default: 'en' }
}, { timestamps: true });

module.exports = mongoose.model('UserResponse', userResponseSchema);
