// routes/candidateRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  applyAsCandidate,
  getCandidatesByElection,
  getMyApplications,
  approveCandidate,
  rejectCandidate,
  getPendingCandidates,
} = require("../controllers/candidateController");

// Protected routes
router.post("/apply", protect, applyAsCandidate);
router.get("/my-applications", protect, getMyApplications);
router.get("/election/:electionId", protect, getCandidatesByElection);

// Admin-only routes
router.get("/pending", protect, authorize("admin"), getPendingCandidates);
router.put("/:id/approve", protect, authorize("admin"), approveCandidate);
router.put("/:id/reject", protect, authorize("admin"), rejectCandidate);

module.exports = router;
