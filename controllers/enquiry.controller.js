const WebsiteEnquiry = require('../models/enquiry.model');

// GET: Get all website enquiries with pagination and search
exports.getAllWebsiteEnquiries = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Search parameter
    const search = req.query.search || '';

    // Build search query if search term is provided
    let searchQuery = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      searchQuery = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
          { program: searchRegex },
          { status: searchRegex },
        ],
      };
    }

    // Pagination calculation
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await WebsiteEnquiry.countDocuments(searchQuery);

    // Fetch paginated enquiries
    const enquiries = await WebsiteEnquiry.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: enquiries,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries', error: error.message });
  }
};

// POST: Create a new website enquiry
exports.createWebsiteEnquiry = async (req, res) => {
  try {
    const { name, email, phoneNumber, program, ipAddress } = req.body;

    // Check if email already exists
    const emailExists = await WebsiteEnquiry.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if IP address already exists (optional, only if ip is passed)
    // if (ipAddress) {
    //   const ipExists = await WebsiteEnquiry.findOne({ ipAddress });
    //   if (ipExists) {
    //     return res.status(400).json({ success: false, message: 'IP address already submitted an enquiry' });
    //   }
    // }

    const newEnquiry = new WebsiteEnquiry({
      name,
      email,
      phoneNumber,
      program,
      ipAddress: ipAddress || req.ip,
    });

    await newEnquiry.save();
    res.status(201).json({ success: true, message: 'Enquiry submitted successfully', data: newEnquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to submit enquiry', error: error.message });
  }
};

// DELETE: Delete an enquiry by ID
exports.deleteWebsiteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await WebsiteEnquiry.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.status(200).json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete enquiry', error: error.message });
  }
};


// PUT: Update a website enquiry by ID
exports.updateWebsiteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const enquiry = await WebsiteEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    // If email is being updated, check uniqueness
    if (updateData.email && updateData.email !== enquiry.email) {
      const emailExists = await WebsiteEnquiry.findOne({ email: updateData.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
    }

    // If IP address is being updated, check uniqueness
    // if (updateData.ipAddress && updateData.ipAddress !== enquiry.ipAddress) {
    //   const ipExists = await WebsiteEnquiry.findOne({ ipAddress: updateData.ipAddress });
    //   if (ipExists) {
    //     return res.status(400).json({ success: false, message: 'IP address already used' });
    //   }
    // }

    const updated = await WebsiteEnquiry.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, message: 'Enquiry updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update enquiry', error: error.message });
  }
};