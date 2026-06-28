// models/User.js — User schema with encrypted fields
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    age: {
      type: Number,
    },
    // Encrypted with AES-256
    uniqueId: {
      type: String,
      required: [true, "Unique ID is required"],
    },
    // Encrypted with AES-256
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
    },
    // Encrypted with AES-256 — stored as JSON string of float array
    faceEmbedding: {
      type: String,
      default: null,
    },
    // Whether the user has completed face setup
    faceSetupComplete: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["voter", "candidate", "admin"],
      default: "voter",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Ethereum address assigned by backend for blockchain voting
    walletAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate age from DOB before saving
userSchema.pre("save", function (next) {
  if (this.isModified("dob")) {
    const today = new Date();
    const birth = new Date(this.dob);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
