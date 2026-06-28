// controllers/electionController.js — Election CRUD and management
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const blockchainService = require("../services/blockchainService");

/**
 * @route   POST /api/elections
 * @desc    Create a new election
 * @access  Admin
 */
const createElection = async (req, res) => {
  try {
    const { title, description, startTime, endTime, eligibleVoters } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, and end time are required",
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const election = await Election.create({
      title,
      description: description || "",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      eligibleVoters: eligibleVoters || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Election created successfully",
      data: election,
    });
  } catch (error) {
    console.error("Create election error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create election",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/elections
 * @desc    Get all elections (filtered by role)
 * @access  Private
 */
const getElections = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // If voter, only show elections they're eligible for
    if (req.user.role === "voter" || req.user.role === "candidate") {
      filter.$or = [
        { eligibleVoters: { $in: [req.user._id] } },
        { eligibleVoters: { $size: 0 } }, // Elections open to all
      ];
    }

    const elections = await Election.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Attach candidate count to each election
    const electionsWithCandidates = await Promise.all(
      elections.map(async (election) => {
        const candidateCount = await Candidate.countDocuments({
          electionId: election._id,
          status: "approved",
        });
        return {
          ...election.toObject(),
          approvedCandidateCount: candidateCount,
        };
      })
    );

    res.json({
      success: true,
      data: electionsWithCandidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch elections",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/elections/:id
 * @desc    Get election details with candidates
 * @access  Private
 */
const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("eligibleVoters", "name email");

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    // Get approved candidates
    const candidates = await Candidate.find({
      electionId: election._id,
      status: "approved",
    }).populate("userId", "name email");

    // Get blockchain info if contract deployed
    let blockchainInfo = null;
    if (election.contractAddress) {
      try {
        blockchainInfo = await blockchainService.getElectionInfo(
          election.contractAddress
        );
      } catch (err) {
        console.warn("Could not fetch blockchain info:", err.message);
      }
    }

    res.json({
      success: true,
      data: {
        election,
        candidates,
        blockchainInfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch election",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/elections/:id
 * @desc    Update election details
 * @access  Admin
 */
const updateElection = async (req, res) => {
  try {
    const { title, description, startTime, endTime, eligibleVoters } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify an active election",
      });
    }

    if (title) election.title = title;
    if (description !== undefined) election.description = description;
    if (startTime) election.startTime = new Date(startTime);
    if (endTime) election.endTime = new Date(endTime);
    if (eligibleVoters) election.eligibleVoters = eligibleVoters;

    await election.save();

    res.json({
      success: true,
      message: "Election updated successfully",
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update election",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/elections/:id/deploy
 * @desc    Deploy smart contract for an election and start it
 * @access  Admin
 */
const deployElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.contractAddress) {
      return res.status(400).json({
        success: false,
        message: "Contract already deployed for this election",
      });
    }

    // Count approved candidates
    const approvedCandidates = await Candidate.find({
      electionId: election._id,
      status: "approved",
    });

    if (approvedCandidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one approved candidate is required before deployment",
      });
    }

    // Assign candidate numbers (1-indexed)
    for (let i = 0; i < approvedCandidates.length; i++) {
      approvedCandidates[i].candidateNumber = i + 1;
      await approvedCandidates[i].save();
    }

    // Deploy contract
    const contractAddress = await blockchainService.deployElectionContract(
      election.title,
      approvedCandidates.length
    );

    // Start election on-chain
    await blockchainService.startElection(contractAddress);

    // Update election in DB
    election.contractAddress = contractAddress;
    election.status = "active";
    await election.save();

    res.json({
      success: true,
      message: "Election contract deployed and started successfully",
      data: {
        contractAddress,
        candidateCount: approvedCandidates.length,
        candidates: approvedCandidates.map((c) => ({
          number: c.candidateNumber,
          userId: c.userId,
          partyName: c.partyName,
        })),
      },
    });
  } catch (error) {
    console.error("Deploy election error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deploy election contract",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/elections/:id/end
 * @desc    End an active election
 * @access  Admin
 */
const endElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Election is not currently active",
      });
    }

    // End on blockchain
    if (election.contractAddress) {
      await blockchainService.endElection(election.contractAddress);
    }

    election.status = "ended";
    await election.save();

    res.json({
      success: true,
      message: "Election ended successfully",
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to end election",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/elections/:id/publish-results
 * @desc    Publish election results
 * @access  Admin
 */
const publishResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    if (election.status !== "ended") {
      return res.status(400).json({
        success: false,
        message: "Election must be ended before publishing results",
      });
    }

    // Publish on blockchain
    if (election.contractAddress) {
      await blockchainService.publishResults(election.contractAddress);
    }

    election.isResultPublished = true;
    await election.save();

    res.json({
      success: true,
      message: "Results published successfully",
      data: election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to publish results",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/elections/:id/results
 * @desc    Get election results from blockchain
 * @access  Private (only if published)
 */
const getResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    // Only admin can see results before publishing
    if (!election.isResultPublished && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Results have not been published yet",
      });
    }

    if (!election.contractAddress) {
      return res.status(400).json({
        success: false,
        message: "No blockchain contract deployed for this election",
      });
    }

    // Get results from blockchain
    const voteCounts = await blockchainService.getElectionResults(
      election.contractAddress
    );

    // Get candidate details
    const candidates = await Candidate.find({
      electionId: election._id,
      status: "approved",
    })
      .populate("userId", "name email")
      .sort({ candidateNumber: 1 });

    // Combine candidate info with vote counts
    const results = candidates.map((candidate, idx) => ({
      candidateNumber: candidate.candidateNumber,
      name: candidate.userId.name,
      partyName: candidate.partyName,
      votes: voteCounts[idx] || 0,
    }));

    // Sort by votes descending
    results.sort((a, b) => b.votes - a.votes);

    const blockchainInfo = await blockchainService.getElectionInfo(
      election.contractAddress
    );

    res.json({
      success: true,
      data: {
        election: {
          title: election.title,
          status: election.status,
          isResultPublished: election.isResultPublished,
        },
        results,
        totalVotes: blockchainInfo.totalVotes,
        contractAddress: election.contractAddress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/elections/:id
 * @desc    Delete an election (only upcoming ones)
 * @access  Admin
 */
const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found" });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Can only delete upcoming elections",
      });
    }

    await Candidate.deleteMany({ electionId: election._id });
    await Election.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Election deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete election",
      error: error.message,
    });
  }
};

module.exports = {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deployElection,
  endElection,
  publishResults,
  getResults,
  deleteElection,
};
