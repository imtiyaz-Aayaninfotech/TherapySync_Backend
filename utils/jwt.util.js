const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// 🔐 Hardcoded Admin Secret
const ADMIN_SECRET = "vP9#Lr2z!Wx8@Tc4^MqJ$fE7NbD1YgAa";

// Generate Access Token (for users)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      mobileNumber: user.mobileNumber,
    },
    ACCESS_SECRET,
    { expiresIn: "1d" }
  );
};

// Generate Refresh Token (for users)
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: "7d" });
};

// ✅ Admin Token
const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      username: admin.username,
      role: "admin",
    },
    ADMIN_SECRET,
    { expiresIn: "1h" }
  );
};

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

// ✅ Verify Admin Token
const verifyAdminToken = (token) => jwt.verify(token, ADMIN_SECRET);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAdminToken,
  verifyAdminToken,
};
