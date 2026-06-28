// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const {
  register,
  verifyEmail,
  login,
  verifyLogin,
  resendOtp,
  setupFace,
  getMe,
} = require("../controllers/authController");

// Public routes
router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/login", authLimiter, login);
router.post("/verify-login", authLimiter, verifyLogin);
router.post("/resend-otp", otpLimiter, resendOtp);

// Protected routes
router.post("/setup-face", protect, setupFace);
router.get("/me", protect, getMe);

module.exports = router;
