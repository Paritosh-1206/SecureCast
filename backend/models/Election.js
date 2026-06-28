// models/Election.js — Election schema
const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    // Address of the deployed smart contract for this election
    contractAddress: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
    },
    // List of user IDs eligible to vote in this election
    eligibleVoters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isResultPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: check if election is currently active based on time
electionSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime;
});

module.exports = mongoose.model("Election", electionSchema);
