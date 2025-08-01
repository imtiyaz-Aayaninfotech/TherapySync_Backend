import Biographical from "../models/BiographicalQuestionnaire.js";
import Response from "../models/BiographicalResponse.js";
import User from "../models/user.model.js";

export const createBiographical = async (req, res) => {
  try {
    const doc = await Biographical.create(req.body);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical questionnaire created successfully",
      data: [doc],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const getAllBiographical = async (req, res) => {
  try {
    const docs = await Biographical.find();
    res.status(200).json({
      status: 200,
      success: true,
      message: "All biographical questionnaires fetched successfully",
      data: docs,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const deleteBiographical = async (req, res) => {
  try {
    await Biographical.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical questionnaire deleted successfully",
      data: [],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

export const updateBiographical = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, instructions, questions } = req.body;

    const updatedDoc = await Biographical.findByIdAndUpdate(
      id,
      {
        name,
        instructions,
        questions,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Biographical questionnaire not found",
        data: []
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical questionnaire updated successfully",
      data: updatedDoc
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: []
    });
  }
};

// submitBiographicalResponse
export const submitBiographicalResponse = async (req, res) => {
  try {
    const response = await Response.create(req.body);
    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical response submitted successfully",
      data: [response],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

// Update Biographical Response
export const updateBiographicalResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Response.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Response not found",
        data: [],
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical response updated successfully",
      data: [updated],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

// Delete Biographical Response
export const deleteBiographicalResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Response.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "Response not found",
        data: [],
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical response deleted successfully",
      data: [deleted],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

// Get All Biographical Responses with filters, search, and pagination
export const getAllBiographicalResponses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", language } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (language) query.language = language;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const total = await Response.countDocuments(query);

    const responses = await Response.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("questionnaireId")
      .lean();

    res.status(200).json({
      status: 200,
      success: true,
      message: "Biographical responses fetched successfully",
      data: responses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
    });
  }
};

