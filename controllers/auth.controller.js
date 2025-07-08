const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const sendOtpEmail = require("../utils/sendOtpEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.util");

// const generateOTP = () =>
//   Math.floor(100000 + Math.random() * 900000).toString();
const generateOTP = () => "123456"; // fixed OTP

exports.register = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, gender, dateOfBirth, image, reason } =
      req.body;

    const existingUser = await User.findOne({ email });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // ✅ CASE 1: Email already exists
    if (existingUser) {
      // 👉 Already verified user
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "Email already registered." });
      }

      // 👉 Not verified, check if OTP expired
      if (!existingUser.otp || existingUser.otp.expiresAt < new Date()) {
        // Generate new OTP and update
        existingUser.otp = { code: otp, expiresAt: otpExpiry };
        await existingUser.save();

        // await sendOtpEmail(email, otp, "Resend OTP");

        return res.status(200).json({
          message: "OTP expired. New OTP sent to your email.",
        });
      }

      // 👉 Not expired but already registered (no need to register again)
      return res.status(400).json({
        message:
          "Email already registered but not verified. Please check your email for OTP.",
      });
    }

    // ✅ CASE 2: New user registration
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      dateOfBirth,
      image,
      reason,
      otp: { code: otp, expiresAt: otpExpiry },
      isVerified: false,
    });

    await newUser.save();

    // await sendOtpEmail(email, otp, "Account Registration");

    res.status(201).json({ message: "User registered. OTP sent to email." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: "User verified successfully" });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Check if verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Your email is not verified. Please verify with OTP.",
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ✅ 5. Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 6. Send tokens
    return res.status(200).json({
      status: 200,
      success: true,
      message: "Login successful",
      data: [
        {
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // ✅ Decode and verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // ✅ Find user and check if this refresh token exists (optional DB validation)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // 👉 Optional: Check if you store refreshToken in DB (for security)
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid stored refresh token" });
    }

    // ✅ Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    //  Update user's stored refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        data: [],
      });
    }

    user.refreshToken = "";
    await user.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Logout successful",
      data: [],
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res
        .status(404)
        .json({ message: "User not found or not verified" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    user.otp = { code: otp, expiresAt: otpExpiry };
    await user.save();

    // await sendOtpEmail(email, otp, "Password Reset");

    res.json({ message: "OTP sent to your email for password reset" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP for Password Reset
exports.verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = undefined; // Clear OTP
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
