// models/Candidate.js — Candidate application schema
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    manifesto: {
      type: String,
      required: [true, "Manifesto is required"],
      maxlength: 5000,
    },
    partyName: {
      type: String,
      default: "Independent",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // 1-indexed candidate number in the smart contract
    candidateNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A user can only apply once per election
candidateSchema.index({ userId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model("Candidate", candidateSchema);
