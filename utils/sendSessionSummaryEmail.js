const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send session summary email with multiple meetings in one mail
 * @param {string} email - recipient email
 * @param {string} userName - recipient's name
 * @param {Array} sessions - array of sessions, each { date, start, end, meetingLink }
 * @returns Promise
 */
async function sendSessionSummaryEmail(email, userName, sessions) {
  // Compose HTML rows for all sessions
  const sessionRows = sessions.map(({ date, start, end, meetingLink }) => {
    return `
      <tr>
        <td style="padding:10px; border:1px solid #ddd;">${date}</td>
        <td style="padding:10px; border:1px solid #ddd;">${start} - ${end}</td>
        <td style="padding:10px; border:1px solid #ddd;">
          <a href="${meetingLink}" target="_blank" style="color:#1a73e8;">Join Meeting</a>
        </td>
      </tr>
    `;
  }).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Therapy Sessions Summary - TherapySync',
    html: `
      <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding: 30px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:20px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
          <h2 style="color:#003366; text-align:center; margin-bottom: 20px;">Your Upcoming Therapy Sessions</h2>
          <p style="font-size:16px; color:#333;">
            Hello, ${userName},<br/><br/>
            Your upcoming therapy sessions are scheduled as follows:
          </p>
          <table style="width:100%; border-collapse: collapse; margin-top:20px;">
            <thead>
              <tr style="background:#003366; color:#ffffff;">
                <th style="padding:12px;">Date</th>
                <th style="padding:12px;">Time</th>
                <th style="padding:12px;">Meeting Link</th>
              </tr>
            </thead>
            <tbody>
              ${sessionRows}
            </tbody>
          </table>
          <p style="margin-top:30px; font-size:14px; color:#666;">
            Please join your sessions promptly via the provided Zoom links.
          </p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
          <p style="font-size:12px; color:#999; text-align:center;">
            This is an automated message from TherapySync. Please do not reply.
          </p>
        </div>
      </div>
    `,
    // attachments removed to avoid errors
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendSessionSummaryEmail;
