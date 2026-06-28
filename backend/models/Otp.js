// models/Otp.js — OTP schema with automatic expiry (TTL)
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["registration", "login", "voting"],
    default: "registration",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Automatically delete document after 5 minutes
    expires: 300,
  },
});

module.exports = mongoose.model("Otp", otpSchema);
