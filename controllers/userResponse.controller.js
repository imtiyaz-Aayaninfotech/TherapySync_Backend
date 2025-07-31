const UserResponse = require('../models/userResponse.model');
const User = require('../models/user.model');
const Questionnaire = require('../models/questionnaire.model');
const { submitResponseSchema } = require('../validations/userResponse.validator');

// CREATE
exports.submitResponse = async (req, res) => {
  const { error } = submitResponseSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const response = await UserResponse.create(req.body);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Response saved successfully",
      data: [response]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL BASIC
exports.getAllUserResponses = async (req, res) => {
  try {
    const responses = await UserResponse.find();
    res.status(200).json({
      status: 200,
      success: true,
      message: "All responses fetched successfully",
      data: responses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BY USER
exports.getUserResponses = async (req, res) => {
  try {
    const responses = await UserResponse.find({ userId: req.params.userId });
    res.status(200).json({
      status: 200,
      success: true,
      message: "User responses fetched successfully",
      data: responses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BY USER + QUESTIONNAIRE
exports.getUserResponseByQuestionnaire = async (req, res) => {
  try {
    const response = await UserResponse.findOne({
      userId: req.params.userId,
      questionnaireId: req.params.questionnaireId
    });

    if (!response) return res.status(404).json({ success: false, message: 'Response not found' });

    res.status(200).json({
      status: 200,
      success: true,
      message: "User questionnaire response fetched successfully",
      data: [response]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL FULL DATA
exports.getAllFullUserResponses = async (req, res) => {
  try {
    let { page = 1, limit = 10, language, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
 
    let filter = {};
 
    if (language) {
      filter.language = language;
    }
 
    // Handle search keyword for user name or email
    let userIdsToFilter = [];
    if (search) {
      // Find users whose name/email match search
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }, { _id: 1 }).lean();
      userIdsToFilter = users.map(u => u._id);
      // If no users found, no need to continue
      if (userIdsToFilter.length === 0) {
        return res.status(200).json({
          status: 200,
          success: true,
          message: "Full user responses with question data fetched successfully",
          total: 0,
          page,
          limit,
          data: [],
        });
      }
      filter.userId = { $in: userIdsToFilter };
    }
 
    // Count total matching documents
    const totalCount = await UserResponse.countDocuments(filter);
 
    // Apply pagination AFTER search filtering
    const responses = await UserResponse.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();
 
    // Gather referenced users and questionnaires as before
    const userIds = [...new Set(responses.map(r => r.userId.toString()))];
    const questionnaireIds = [...new Set(responses.map(r => r.questionnaireId.toString()))];
 
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const questionnaires = await Questionnaire.find({ _id: { $in: questionnaireIds } }).lean();
 
    const usersMap = {};
    users.forEach(user => {
      usersMap[user._id.toString()] = { name: user.name, email: user.email };
    });
 
    const questionnaireMap = {};
    questionnaires.forEach(q => {
      const questionMap = {};
      q.questions.forEach(qn => {
        questionMap[qn.id] = qn.text;
      });
      questionnaireMap[q._id.toString()] = questionMap;
    });
 
    const result = responses.map(response => {
      const user = usersMap[response.userId.toString()];
      const questionTexts = questionnaireMap[response.questionnaireId.toString()] || {};
      return {
        _id: response._id,
        name: user?.name,
        email: user?.email,
        language: response.language,
        answers: response.answers.map(ans => ({
          questionId: ans.questionId,
          questionText: questionTexts[ans.questionId]?.[response.language] || '',
          frequency: ans.frequency,
          intensity: ans.intensity
        }))
      };
    });
 
    res.status(200).json({
      status: 200,
      success: true,
      message: "Full user responses with question data fetched successfully",
      total: totalCount,
      page,
      limit,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// UPDATE
exports.updateUserResponse = async (req, res) => {
  try {
    const updated = await UserResponse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Response not found' });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Response updated successfully",
      data: [updated]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteUserResponse = async (req, res) => {
  try {
    const deleted = await UserResponse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Response not found' });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Response deleted successfully",
      data: [deleted]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
