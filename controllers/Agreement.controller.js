const Agreement = require("../models/Agreement.model");


// Create or update Agreement
exports.createOrUpdateAgreement = async (req, res) => {
  try {
    const { content, version, createdBy } = req.body;

    // Find the existing active agreement
    const existingAgreement = await Agreement.findOne({ isActive: true });

    if (!existingAgreement) {
      // No existing agreement, create a new one
      const newAgreement = new Agreement({
        content,
        version,
        createdBy,
        lastUpdated: new Date(),
      });
      await newAgreement.save();

      return res.status(201).json({
        status: 201,
        success: true,
        message: "Agreement created successfully.",
        data: newAgreement,
      });
    }

    // Check if the version is the same
    if (existingAgreement.version === version) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "No update needed. Agreement version is already up to date.",
        data: existingAgreement,
      });
    }

    // If version is different, update only the content and version
    existingAgreement.content = content;
    existingAgreement.version = version;
    existingAgreement.lastUpdated = new Date();
    existingAgreement.createdBy = createdBy;
    await existingAgreement.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Agreement updated with new version.",
      data: existingAgreement,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      data: [],
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

//  only the users who accepted the agreement
exports.getAcceptedAgreementUsers = async (req, res) => {
  try {
    // Find the agreement document (you can filter by ID or isActive: true)
    const agreement = await Agreement.findOne({ isActive: true }).populate({
      path: "acceptedByUsers.user",
      select: "name email region phoneNumber", // Only include these fields
    });

    if (!agreement) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "No active agreement found.",
        data: [],
      });
    }

    // Extract only necessary info from accepted users
    const acceptedUsers = agreement.acceptedByUsers
      .filter(entry => entry.user) // In case a user was deleted
      .map(entry => ({
        name: entry.user.name,
        email: entry.user.email,
        region: entry.user.region,
        phoneNumber: entry.user.phoneNumber,
      }));

    res.status(200).json({
      status: 200,
      success: true,
      message: "Accepted agreement users fetched successfully",
      data: acceptedUsers,
    });
  } catch (err) {
    console.error("Error fetching accepted agreement users:", err);
    res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};