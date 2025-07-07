const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const sendOtpEmail = require("../utils/sendOtpEmail");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, gender, dateOfBirth, image } =
      req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      dateOfBirth,
      image,
      otp: { code: otp, expiresAt: otpExpiry },
      isVerified: false,
    });

    await newUser.save();

    // Send OTP via email
    await sendOtpEmail(email, otp, "Account Registration");

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
