const mongoose = require("mongoose");

const BiographicalQuestionnaireSchema = new mongoose.Schema({
  name: { type: Map, of: String },
  instructions: { type: Map, of: String },
  questions: [
    {
      id: Number,
      text: { type: Map, of: String },
      options: { type: Map, of: [String] }
    }
  ]
}, { timestamps: true });


module.exports = mongoose.model("BiographicalQuestionnaire", BiographicalQuestionnaireSchema);
