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
    res.status(201).json({ success: true, agreement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get current active TOS
exports.getActiveAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findOne({ isActive: true }).sort({ lastUpdated: -1 });
    if (!agreement) {
      return res.status(404).json({ success: false, message: "No active agreement found." });
    }
    res.json({ success: true, agreement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Accept agreement by user
exports.acceptAgreement = async (req, res) => {
  try {
    const { userId } = req.body;

    const activeAgreement = await Agreement.findOne({ isActive: true }).sort({ lastUpdated: -1 });

    if (!activeAgreement) {
      return res.status(404).json({ success: false, message: "No active agreement to accept." });
    }

    // Check if already accepted
    const alreadyAccepted = activeAgreement.acceptedByUsers.find(entry =>
      entry.user.toString() === userId.toString()
    );

    if (alreadyAccepted) {
      return res.status(400).json({ success: false, message: "Already accepted." });
    }

    activeAgreement.acceptedByUsers.push({
      user: userId,
      versionAccepted: activeAgreement.version,
    });

    await activeAgreement.save();
    res.json({ success: true, message: "Agreement accepted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all agreements (admin)
exports.getAllAgreements = async (req, res) => {
  try {
    const agreements = await Agreement.find().sort({ createdAt: -1 });
    res.json({ success: true, agreements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
