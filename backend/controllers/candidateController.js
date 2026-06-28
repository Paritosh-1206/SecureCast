// controllers/candidateController.js — Candidate application management
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const User = require("../models/User");

/**
 * @route   POST /api/candidates/apply
 * @desc    Apply as a candidate for an election
 * @access  Private (voter or candidate)
 */
const applyAsCandidate = async (req, res) => {
  try {
    const { electionId, manifesto, partyName } = req.body;

    if (!electionId || !manifesto) {
      return res.status(400).json({
        success: false,
        message: "Election ID and manifesto are required",
      });
    }

    // Check election exists and is upcoming
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Can only apply for upcoming elections",
      });
    }

    // Check for duplicate application
    const existing = await Candidate.findOne({
      userId: req.user._id,
      electionId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this election",
      });
    }

    const candidate = await Candidate.create({
      userId: req.user._id,
      electionId,
      manifesto,
      partyName: partyName || "Independent",
    });

    // Update user role to candidate if currently voter
    if (req.user.role === "voter") {
      await User.findByIdAndUpdate(req.user._id, { role: "candidate" });
    }

    res.status(201).json({
      success: true,
      message: "Candidate application submitted successfully",
      data: candidate,
    });
  } catch (error) {
    console.error("Candidate apply error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/candidates/election/:electionId
 * @desc    Get all candidates for an election
 * @access  Private
 */
const getCandidatesByElection = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { electionId: req.params.electionId };
    if (status) filter.status = status;

    const candidates = await Candidate.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/candidates/my-applications
 * @desc    Get current user's candidate applications
 * @access  Private
 */
const getMyApplications = async (req, res) => {
  try {
    const candidates = await Candidate.find({ userId: req.user._id })
      .populate("electionId", "title startTime endTime status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/candidates/:id/approve
 * @desc    Approve a candidate application
 * @access  Admin
 */
const approveCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("userId", "name email");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate application not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate approved successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve candidate",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/candidates/:id/reject
 * @desc    Reject a candidate application
 * @access  Admin
 */
const rejectCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("userId", "name email");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate application not found",
      });
    }

    res.json({
      success: true,
      message: "Candidate rejected",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject candidate",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/candidates/pending
 * @desc    Get all pending candidate applications (admin view)
 * @access  Admin
 */
const getPendingCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({ status: "pending" })
      .populate("userId", "name email")
      .populate("electionId", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending candidates",
      error: error.message,
    });
  }
};

module.exports = {
  applyAsCandidate,
  getCandidatesByElection,
  getMyApplications,
  approveCandidate,
  rejectCandidate,
  getPendingCandidates,
};
