const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const sendOtpEmail = require("../utils/sendOtpEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.util");
const uploadSingleImage = require('../utils/aws/uploadSingleImage');
const DeviceToken = require('../models/DeviceToken.model');

// const generateOTP = () =>
//   Math.floor(100000 + Math.random() * 900000).toString();
const generateOTP = () => "123456"; // fixed OTP

const countryTimeZoneMap = {
  UK: "Europe/London",
  Ireland: "Europe/Dublin",
  Luxembourg: "Europe/Luxembourg",
  Latvia: "Europe/Riga",
  Hungary: "Europe/Budapest",
  Bulgaria: "Europe/Sofia",
  Cyprus: "Asia/Nicosia",
  Romania: "Europe/Bucharest",
  Poland: "Europe/Warsaw",
  "Czech Republic": "Europe/Prague",
  Berlin: "Europe/Berlin",
  Thessaloniki: "Europe/Athens",
};


// exports.register = async (req, res) => {
//   try {
//     const { email, password, name, phoneNumber, gender, dateOfBirth, image, region } =
//       req.body;

//     const existingUser = await User.findOne({ email });

//     const otp = generateOTP();
//     const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//     // ✅ CASE 1: Email already exists
//     if (existingUser) {
//       // 👉 Already verified user
//       if (existingUser.isVerified) {
//         return res.status(400).json({ message: "Email already registered." });
//       }

//       // ❗ Enforce 5-minute gap between OTP sends
//       if (existingUser.otp && existingUser.otp.expiresAt > new Date()) {
//         const waitMs = new Date(existingUser.otp.expiresAt).getTime() - Date.now();
//         const waitSec = Math.ceil(waitMs / 1000);
//         return res.status(429).json({
//           message: `Please wait ${waitSec} seconds before requesting a new OTP.`,
//         });
//       }

//       // OTP expired or not sent before
//       existingUser.otp = { code: otp, expiresAt: otpExpiry };
//       await existingUser.save();

//       // await sendOtpEmail(email, otp, "Resend OTP");

//       return res.status(200).json({
//         message: "OTP expired or not found. New OTP sent to your email.",
//       });
//     }

//     // ✅ CASE 2: New user registration
//     let imageUrl = '';
//     if (req.file) {
//       imageUrl = await uploadSingleImage(req.file);
//     }

//     // ✅ CASE 2: New user registration
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       email,
//       password: hashedPassword,
//       name,
//       phoneNumber,
//       gender,
//       dateOfBirth,
//       image: imageUrl,
//       region,
//       // region: "Berlin",  // force Berlin here unconditionally
//       otp: { code: otp, expiresAt: otpExpiry },
//       isVerified: false,
//     });

//     await newUser.save();

//     // await sendOtpEmail(email, otp, "Account Registration");

//     // res.status(201).json({ message: "User registered. OTP sent to email." });
//     return res.status(201).json({
//   status: 201,
//   success: true,
//   message: "User registered. OTP sent to email.",
//   data: {
//     isVerified: false,
//     otpSent: true,
//     user: {
//       email: newUser.email,
//       name: newUser.name,
//       phoneNumber: newUser.phoneNumber,
//       gender: newUser.gender,
//       dateOfBirth: newUser.dateOfBirth,
//       region: newUser.region,
//       image: newUser.image,
//       isVerified: newUser.isVerified
//     }
//   }
// });
//   } catch (error) {
//     console.error("Register Error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phoneNumber,
      gender,
      dateOfBirth,
      country
    } = req.body;

    // ✅ Validate country
    if (!countryTimeZoneMap[country]) {
      return res.status(400).json({ message: "Invalid country selected." });
    }

    const timeZone = countryTimeZoneMap[country];

    const existingUser = await User.findOne({ email });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "Email already registered." });
      }

      existingUser.otp = { code: otp, expiresAt: otpExpiry };
      await existingUser.save();

      return res.status(200).json({
        message: "New OTP sent.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      dateOfBirth,
      country,
      timeZone,
      otp: { code: otp, expiresAt: otpExpiry },
      isVerified: false,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        email: newUser.email,
        country: newUser.country,
        timeZone: newUser.timeZone,
      },
    });

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

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         status: 404,
//         success: false,
//         message: "User not found",
//         data: [],
//       });
//     }

//     // 2. Check if verified
//     if (!user.isVerified) {
//       return res.status(403).json({
//         status: 403,
//         success: false,
//         message: "Your email is not verified. Please verify with OTP.",
//         data: [],
//       });
//     }

//     // 3. Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({
//         status: 400,
//         success: false,
//         message: "Incorrect password",
//         data: [],
//       });
//     }

//     // 4. Generate tokens
//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);

//     // 5. Save refresh token in DB
//     user.refreshToken = refreshToken;
//     await user.save();

//     // 6. Send tokens
//     return res.status(200).json({
//       status: 200,
//       success: true,
//       message: "Login successful",
//       data: [
//         {
//           accessToken,
//           refreshToken,
//           user: {
//             id: user._id,
//             name: user.name,
//             email: user.email,
//             mobileNumber: user.mobileNumber,
//           },
//         },
//       ],
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     return res.status(500).json({
//       status: 500,
//       success: false,
//       message: "Internal server error",
//       data: [],
//     });
//   }
// };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        data: [],
      });
    }
    // 2. Check if verified
    // if (!user.isVerified) {
    //   const now = new Date();
    //   // Check if OTP still valid, if yes, do not resend but ask user to verify
    //   if (user.otp && user.otp.expiresAt > now) {
    //     return res.status(200).json({
    //       status: 200,
    //       success: false,
    //       message: "Your email is not verified. Please verify with OTP sent earlier.",
    //       data: [],
    //     });
    //   }
    //   // Generate new OTP and expiry
    //   const otp = generateOTP();
    //   const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    //   user.otp = { code: otp, expiresAt: otpExpiry };
    //   await user.save();
    //   // Optionally send email OTP here when sendOtpEmail utility is ready
    //   await sendOtpEmail(user.email, otp, "Login OTP Verification");
    //   return res.status(200).json({
    //     status: 200,
    //     success: false,
    //     message: "Your email is not verified. New OTP sent to your email.",
    //     data: [],
    //   });
    // }

    if (!user.isVerified) {
      const now = new Date();
      // Check if OTP still valid, if yes, do not resend but ask user to verify
      if (user.otp && user.otp.expiresAt > now) {
        return res.status(200).json({
          status: 200,
          success: false,
          message: "Your email is not verified. Please verify with OTP sent earlier.",
          data: [],
        });
      }
      // Generate new hardcoded OTP and expiry
      const otp = "123456";  // hardcoded OTP
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      user.otp = { code: otp, expiresAt: otpExpiry };
      await user.save();
      // Optionally send OTP email if needed
      // await sendOtpEmail(user.email, otp, "Login OTP Verification");
      return res.status(200).json({
        status: 200,
        success: false,
        message: "Your email is not verified. New OTP sent to your email.",
        data: [],
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Incorrect password",
        data: [],
      });
    }
    // 4. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    // 5. Save refresh token in DB
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
            isVerified:user.isVerified,
            country: user.country,
            timeZone: user.timeZone
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
    
    // Remove all device tokens for this user
    await DeviceToken.deleteMany({ userId: user._id });

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

    // ❗ Enforce 5-minute wait
    if (user.otp && user.otp.expiresAt > new Date()) {
      const waitMs = new Date(user.otp.expiresAt).getTime() - Date.now();
      const waitSec = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before requesting a new OTP.`,
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

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

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Current password and new password are required",
        data: [],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
        data: [],
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Current password is incorrect",
        data: [],
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Password changed successfully",
      data: [],
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

// update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const updateFields = {};

    const {
      name,
      email,
      phoneNumber,
      gender,
      dateOfBirth,
      country,
      language
    } = req.body;

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (gender) updateFields.gender = gender;
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
    if (language) updateFields.language = language;

    // ✅ If country updated → auto update timezone
    if (country) {
      if (!countryTimeZoneMap[country]) {
        return res.status(400).json({ message: "Invalid country selected." });
      }

      updateFields.country = country;
      updateFields.timeZone = countryTimeZoneMap[country];
    }

    if (req.file) {
      const imageUrl = await uploadSingleImage(req.file);
      updateFields.image = imageUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
