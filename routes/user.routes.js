const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/user.controller');
const verifyAuth = require('../middlewares/auth.middleware'); 

// ✅ Get all users with filters
router.get('/all', getAllUsers);

module.exports = router;
