const express = require("express");
const router = express.Router();
const { generateAdminToken, verifyAdminToken } = require("../utils/jwt.util");

// 🔐 Hardcoded Admin Credentials
const admins = [
  { username: "admin", password: "admin123" },
  { username: "imo", password: "imo" },
];

// Admin Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const admin = admins.find(
    (a) => a.username === username && a.password === password
  );

  if (!admin) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = generateAdminToken(admin);
  return res.json({ token });
});

// Middleware (inline here or you can move it to separate file)
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAdminToken(token);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired admin token" });
  }
};

// ✅ Protected Route
router.get("/dashboard", adminAuth, (req, res) => {
  res.json({ message: `Welcome Admin ${req.admin.username}` });
});

module.exports = router;
