require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSmtp() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log(`Testing SMTP connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}...`);
  console.log(`Using account: ${process.env.SMTP_USER}`);

  try {
    const result = await transporter.verify();
    console.log('✅ SMTP connection successful! Mail service is ready.');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
  }

  process.exit(0);
}

testSmtp();
