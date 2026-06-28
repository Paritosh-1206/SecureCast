// services/emailService.js — OTP email delivery via SMTP
const nodemailer = require("nodemailer");

let transporter;

/**
 * Initialize the SMTP transporter
 */
const initEmailService = () => {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log(`✅ Email service initialized (${process.env.SMTP_HOST})`);
};

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to an email address
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - What the OTP is for (registration, login, voting)
 */
const sendOTP = async (email, otp, purpose = "verification") => {
  const purposeMap = {
    registration: "Email Verification",
    login: "Login Verification",
    voting: "Vote Authentication",
  };

  const subject = `SecureCast — ${purposeMap[purpose] || "Verification"} OTP`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a5b4fc; margin: 0; font-size: 28px;">🗳️ SecureCast</h1>
        <p style="color: #c7d2fe; margin-top: 4px; font-size: 14px;">Secure Online Voting Platform</p>
      </div>
      <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center;">
        <p style="color: #e0e7ff; font-size: 16px; margin-top: 0;">Your <strong>${purposeMap[purpose] || "Verification"}</strong> OTP is:</p>
        <div style="background: rgba(79, 70, 229, 0.3); border: 2px solid #6366f1; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${otp}</span>
        </div>
        <p style="color: #a5b4fc; font-size: 13px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"SecureCast" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`📧 OTP sent to ${email} (purpose: ${purpose})`);
    return true;
  } catch (error) {
    // Fallback: log OTP to console in development
    console.error(`❌ Email send failed: ${error.message}`);
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 [DEV FALLBACK] OTP for ${email}: ${otp}`);
      return true;
    }
    return false;
  }
};

module.exports = { initEmailService, generateOTP, sendOTP };
