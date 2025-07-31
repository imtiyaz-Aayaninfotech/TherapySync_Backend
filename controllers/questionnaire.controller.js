const Questionnaire = require('../models/questionnaire.model');
const { createQuestionnaireSchema } = require('../validations/questionnaire.validator');

exports.createQuestionnaire = async (req, res) => {
  const { error } = createQuestionnaireSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });
  try {
    const questionnaire = await Questionnaire.create(req.body);
    res.status(200).json({ success: true, message: 'Questionnaire created', data: questionnaire });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllQuestionnaires = async (req, res) => {
  try {
    const data = await Questionnaire.find();
    res.status(200).json({ success: true, message: '', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getQuestionnaireById = async (req, res) => {
  try {
    const data = await Questionnaire.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: '', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateQuestionnaire = async (req, res) => {
  try {
    const updated = await Questionnaire.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteQuestionnaire = async (req, res) => {
  try {
    await Questionnaire.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};