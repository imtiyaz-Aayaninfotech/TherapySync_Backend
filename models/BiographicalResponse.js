const mongoose = require('mongoose');

const BiographicalResponseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // ✅ ref added
  questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: 'BiographicalQuestionnaire' },
  language: String,
  answers: [
    {
      questionId: Number,
      sectionTitle: String,
      response: mongoose.Schema.Types.Mixed
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("BiographicalResponse", BiographicalResponseSchema);
