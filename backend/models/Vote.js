// models/Vote.js — Vote record (off-chain backup of on-chain data)
const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    // Blockchain transaction hash
    txHash: {
      type: String,
      required: true,
    },
    // keccak256 hash stored on-chain
    voteHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A voter can only vote once per election
voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
