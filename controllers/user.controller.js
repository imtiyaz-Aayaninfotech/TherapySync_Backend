const User = require('../models/user.model');

/*
Filter users by reason dynamically (e.g., Berlin, Thessaloniki)
Pagination support: page, limit
Sorting: sortBy field and order (asc/desc)
Search: by name, email, or phoneNumber
Shows latest data on top by default (createdAt descending)
*/
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      reason,
      search,
    } = req.query;

    const query = {};

    // 🔍 Dynamic reason filter
    if (reason) {
      query.reason = reason;
    }

    // 🔍 Text search (name, email, phoneNumber)
    if (search) {
      const regex = new RegExp(search, 'i'); // case-insensitive
      query.$or = [
        { name: regex },
        { email: regex },
        { phoneNumber: regex },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      users,
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
