// controllers/adminController.js — Admin management of users and system
const User = require("../models/User");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin view)
 * @access  Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, isApproved, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === "true";

    const users = await User.find(filter)
      .select("-password -faceEmbedding")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/approve
 * @desc    Approve a user
 * @access  Admin
 */
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password -faceEmbedding");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${user.name} approved successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve user",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/reject
 * @desc    Reject/Disapprove a user
 * @access  Admin
 */
const rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select("-password -faceEmbedding");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${user.name} rejected`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject user",
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Admin
 */
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["voter", "candidate", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be voter, candidate, or admin.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -faceEmbedding");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User role changed to ${role}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change user role",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin
 */
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const pendingUsers = await User.countDocuments({ isApproved: false, isEmailVerified: true });
    const voters = await User.countDocuments({ role: "voter" });
    const candidates = await User.countDocuments({ role: "candidate" });

    const Election = require("../models/Election");
    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: "active" });

    const Vote = require("../models/Vote");
    const totalVotes = await Vote.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        approvedUsers,
        pendingUsers,
        voters,
        candidates,
        totalElections,
        activeElections,
        totalVotes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get stats",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  approveUser,
  rejectUser,
  changeUserRole,
  getStats,
};
