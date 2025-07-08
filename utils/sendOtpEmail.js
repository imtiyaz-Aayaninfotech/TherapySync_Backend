const nodemailer = require('nodemailer');
const generateOtpMailOptions = require('./generateOtpMailOptions');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

const sendOtpEmail = async (email, otp, purpose = 'Verification') => {
  const mailOptions = generateOtpMailOptions(email, otp, purpose);
  return transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
