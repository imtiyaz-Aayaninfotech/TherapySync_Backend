const nodemailer = require('nodemailer');
const generateOtpMailOptions = require('./generateOtpMailOptions');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'ai083.development@gmail.com',
    pass: 'ayob xhol ssvb koqx', 
  },
});

const sendOtpEmail = async (email, otp, purpose = 'Verification') => {
  const mailOptions = generateOtpMailOptions(email, otp, purpose);
  return transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
