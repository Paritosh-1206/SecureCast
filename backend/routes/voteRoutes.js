// routes/voteRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { otpLimiter } = require("../middleware/rateLimiter");
const {
  sendVotingOtp,
  verifyVotingOtp,
  livenessCheck,
  faceVerification,
  castVote,
  getVoteStatus,
} = require("../controllers/voteController");

// All vote routes require authentication
router.use(protect);

// Voting flow (sequential steps)
router.post("/send-otp", otpLimiter, sendVotingOtp);
router.post("/verify-otp", verifyVotingOtp);
router.post("/liveness", livenessCheck);
router.post("/verify-face", faceVerification);
router.post("/cast", castVote);

// Status check
router.get("/status/:electionId", getVoteStatus);

module.exports = router;
