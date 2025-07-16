const mongoose = require('mongoose');
const User = require('../models/user.model');

/*
Filter users by region dynamically (e.g., Berlin, Thessaloniki)
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
      region,
      search,
    } = req.query;

    const query = {};

    // 🔍 Dynamic region filter
    if (region) {
      query.region = region;
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

// ✏️ Edit user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = req.body;

    // Prevent changing sensitive fields manually
    delete updates.password;
    delete updates.otp;
    delete updates.refreshToken;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ❌ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Invalid user ID",
        data: [],
      });
    }

    const user = await User.findById(userId).select('-password -refreshToken -otp');

    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        data: [],
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "User fetched successfully",
      data: [user],
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error",
      data: [],
    });
  }
};