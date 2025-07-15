const Agreement = require("../models/Agreement.model");

// Create new Terms of Service
exports.createAgreement = async (req, res) => {
  try {
    const { content, version, createdBy } = req.body;
    const agreement = new Agreement({
      content,
      version,
      createdBy,
      lastUpdated: new Date()
    });
    await agreement.save();
    res.status(201).json({
      status: 201,
      success: true,
      message: "Agreement created successfully.",
      data: agreement
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

// Get current active TOS
exports.getActiveAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findOne({ isActive: true }).sort({ lastUpdated: -1 });
    if (!agreement) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No active agreement found.",
        data: []
      });
    }
    res.status(200).json({
      status: 200,
      success: true,
      message: "Active agreement fetched.",
      data: agreement
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

// Accept agreement by user
exports.acceptAgreement = async (req, res) => {
  try {
    const { userId } = req.body;
    const activeAgreement = await Agreement.findOne({ isActive: true }).sort({ lastUpdated: -1 });

    if (!activeAgreement) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No active agreement to accept.",
        data: []
      });
    }

    const alreadyAccepted = activeAgreement.acceptedByUsers.find(entry =>
      entry.user.toString() === userId.toString()
    );

    if (alreadyAccepted) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Already accepted.",
        data: []
      });
    }

    activeAgreement.acceptedByUsers.push({
      user: userId,
      versionAccepted: activeAgreement.version,
    });

    await activeAgreement.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: "Agreement accepted successfully.",
      data: []
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

// Get all agreements (admin)
exports.getAllAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 200,
      success: true,
      message: "All agreements fetched.",
      data: agreements
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
