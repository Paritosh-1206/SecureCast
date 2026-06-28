// routes/electionRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deployElection,
  endElection,
  publishResults,
  getResults,
  deleteElection,
} = require("../controllers/electionController");

// Protected routes (any authenticated user)
router.get("/", protect, getElections);
router.get("/:id", protect, getElectionById);
router.get("/:id/results", protect, getResults);

// Admin-only routes
router.post("/", protect, authorize("admin"), createElection);
router.put("/:id", protect, authorize("admin"), updateElection);
router.post("/:id/deploy", protect, authorize("admin"), deployElection);
router.post("/:id/end", protect, authorize("admin"), endElection);
router.post("/:id/publish-results", protect, authorize("admin"), publishResults);
router.delete("/:id", protect, authorize("admin"), deleteElection);

module.exports = router;
