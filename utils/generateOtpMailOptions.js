module.exports = function generateOtpMailOptions(
  email,
  otp,
  purpose = "Verification"
) {
  return {
    from: "ai081.development@gmail.com",
    to: email,
    subject: `Your One-Time Password (OTP) – TherapySync`,
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; padding: 40px;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); padding: 40px;">
    <h2 style="color: #2E86C1; text-align: center; margin-bottom: 30px;">🔐 TherapySync – ${purpose} OTP</h2>

    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello,</p>

    <p style="font-size: 16px; color: #333; line-height: 1.6;">
      To continue with <strong>${purpose.toLowerCase()}</strong>, please use the One-Time Password (OTP) below:
    </p>

    <div style="font-size: 32px; font-weight: bold; color: #28a745; text-align: center; margin: 30px 0;">
      ${otp}
    </div>

    <p style="font-size: 16px; color: #555; margin-bottom: 10px;">This OTP is valid for the next <strong>5 minutes</strong>.</p>

    <p style="font-size: 14px; color: #777; line-height: 1.5;">
      If you did not request this OTP, you can safely ignore this email. Please do not share this code with anyone for your security.
    </p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #e0e0e0;">

    <p style="font-size: 12px; color: #aaa; text-align: center;">
      This is an automated message from <strong>TherapySync</strong>. Please do not reply to this email.
    </p>
  </div>
</div>
`,
  };
};
