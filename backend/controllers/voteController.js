// controllers/voteController.js — Voting flow orchestration
// Flow: Verify OTP → Liveness Check → Face Verification → Cast Vote on Blockchain
const Vote = require("../models/Vote");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { decryptEmbedding } = require("../services/encryptionService");
const { generateOTP, sendOTP } = require("../services/emailService");
const { verifyFace, checkLiveness } = require("../services/faceService");
const { castVoteOnChain, hasVoterVoted } = require("../services/blockchainService");
const { generateVoteHash } = require("../utils/helpers");

/**
 * @route   POST /api/vote/send-otp
 * @desc    Step 1: Send voting OTP
 * @access  Private
 */
const sendVotingOtp = async (req, res) => {
  try {
    const { electionId } = req.body;

    if (!electionId) {
      return res.status(400).json({
        success: false,
        message: "Election ID is required",
      });
    }

    // Validate election
    const election = await Election.findById(electionId);
    if (!election || election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Election not found or not active",
      });
    }

    // Check eligibility
    if (
      election.eligibleVoters.length > 0 &&
      !election.eligibleVoters.includes(req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not eligible for this election",
      });
    }

    // Check if already voted (database level)
    const existingVote = await Vote.findOne({
      voterId: req.user._id,
      electionId,
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "You have already voted in this election",
      });
    }

    // Check face setup
    if (!req.user.faceSetupComplete) {
      return res.status(400).json({
        success: false,
        message: "Please complete face setup before voting",
      });
    }

    // Send OTP
    const otp = generateOTP();
    await Otp.create({ email: req.user.email, otp, purpose: "voting" });
    await sendOTP(req.user.email, otp, "voting");

    res.json({
      success: true,
      message: "Voting OTP sent to your email",
    });
  } catch (error) {
    console.error("Send voting OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/vote/verify-otp
 * @desc    Step 2: Verify voting OTP
 * @access  Private
 */
const verifyVotingOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const otpRecord = await Otp.findOne({
      email: req.user.email,
      otp,
      purpose: "voting",
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clean up
    await Otp.deleteMany({ email: req.user.email, purpose: "voting" });

    res.json({
      success: true,
      message: "OTP verified. Proceed to liveness check.",
      data: { otpVerified: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/vote/liveness
 * @desc    Step 3: Liveness detection (blink + yaw)
 * @access  Private
 */
const livenessCheck = async (req, res) => {
  try {
    const { frames } = req.body; // Array of base64 frames

    if (!frames || !Array.isArray(frames) || frames.length < 5) {
      return res.status(400).json({
        success: false,
        message: "At least 5 video frames are required for liveness check",
      });
    }

    const result = await checkLiveness(frames);

    if (!result.passed) {
      return res.status(400).json({
        success: false,
        message: "Liveness check failed. Please ensure you blink and turn your head.",
        data: result,
      });
    }

    res.json({
      success: true,
      message: "Liveness check passed. Proceed to face verification.",
      data: result,
    });
  } catch (error) {
    console.error("Liveness check error:", error);
    res.status(500).json({
      success: false,
      message: "Liveness check failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/vote/verify-face
 * @desc    Step 4: Face verification against stored embedding
 * @access  Private
 */
const faceVerification = async (req, res) => {
  try {
    const { image } = req.body; // base64 face image

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Face image is required",
      });
    }

    // Get stored embedding
    const user = await User.findById(req.user._id);
    if (!user.faceEmbedding) {
      return res.status(400).json({
        success: false,
        message: "Face not registered. Complete face setup first.",
      });
    }

    const storedEmbedding = decryptEmbedding(user.faceEmbedding);
    if (!storedEmbedding) {
      return res.status(500).json({
        success: false,
        message: "Failed to decrypt stored face embedding",
      });
    }

    // Verify face against stored embedding
    const result = await verifyFace(image, storedEmbedding);

    if (!result.verified) {
      return res.status(400).json({
        success: false,
        message: "Face verification failed. Face does not match registered face.",
        data: { similarity: result.similarity },
      });
    }

    res.json({
      success: true,
      message: "Face verified! You can now cast your vote.",
      data: { similarity: result.similarity },
    });
  } catch (error) {
    console.error("Face verification error:", error);
    res.status(500).json({
      success: false,
      message: "Face verification failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/vote/cast
 * @desc    Step 5: Cast vote on blockchain
 * @access  Private
 */
const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;

    if (!electionId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: "Election ID and candidate ID are required",
      });
    }

    // Validate election
    const election = await Election.findById(electionId);
    if (!election || election.status !== "active" || !election.contractAddress) {
      return res.status(400).json({
        success: false,
        message: "Election not found, not active, or contract not deployed",
      });
    }

    // Validate candidate
    const candidate = await Candidate.findOne({
      electionId,
      candidateNumber: candidateId,
      status: "approved",
    });

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate for this election",
      });
    }

    // Check duplicate vote (database level)
    const existingVote = await Vote.findOne({
      voterId: req.user._id,
      electionId,
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "You have already voted in this election",
      });
    }

    // Check duplicate vote (blockchain level)
    const voterAddress = req.user.walletAddress;
    const alreadyVoted = await hasVoterVoted(
      election.contractAddress,
      voterAddress
    );

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: "Vote already recorded on blockchain",
      });
    }

    // Generate vote hash
    const voteHash = generateVoteHash(
      req.user._id.toString(),
      electionId,
      candidateId
    );

    // Cast vote on blockchain
    const txResult = await castVoteOnChain(
      election.contractAddress,
      candidateId,
      voteHash,
      voterAddress
    );

    // Record in database
    const vote = await Vote.create({
      voterId: req.user._id,
      electionId,
      txHash: txResult.txHash,
      voteHash,
    });

    res.json({
      success: true,
      message: "Vote cast successfully! 🗳️",
      data: {
        voteId: vote._id,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
        voteHash,
      },
    });
  } catch (error) {
    console.error("Cast vote error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cast vote",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/vote/status/:electionId
 * @desc    Check if current user has voted in an election
 * @access  Private
 */
const getVoteStatus = async (req, res) => {
  try {
    const vote = await Vote.findOne({
      voterId: req.user._id,
      electionId: req.params.electionId,
    });

    res.json({
      success: true,
      data: {
        hasVoted: !!vote,
        vote: vote
          ? { txHash: vote.txHash, voteHash: vote.voteHash, votedAt: vote.createdAt }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check vote status",
      error: error.message,
    });
  }
};

module.exports = {
  sendVotingOtp,
  verifyVotingOtp,
  livenessCheck,
  faceVerification,
  castVote,
  getVoteStatus,
};
