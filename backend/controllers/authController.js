// controllers/authController.js — Registration, Login, OTP, and Face Setup
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { encrypt } = require("../services/encryptionService");
const { encryptEmbedding, decryptEmbedding } = require("../services/encryptionService");
const { generateOTP, sendOTP } = require("../services/emailService");
const { generateEmbedding } = require("../services/faceService");
const { generateVoterAddress } = require("../services/blockchainService");
const { isValidEmail, calculateAge } = require("../utils/helpers");

/**
 * Generate a JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, dob, uniqueId, mobile } = req.body;

    // Validation
    if (!name || !email || !password || !dob || !uniqueId || !mobile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const age = calculateAge(new Date(dob));
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Encrypt sensitive fields
    const encryptedUniqueId = encrypt(uniqueId);
    const encryptedMobile = encrypt(mobile);

    // Generate deterministic wallet address
    const tempUser = new User({
      name,
      email,
      password: passwordHash,
      dob: new Date(dob),
      uniqueId: encryptedUniqueId,
      mobile: encryptedMobile,
    });

    const savedUser = await tempUser.save();

    // Generate wallet address from user ID
    const walletAddress = generateVoterAddress(savedUser._id.toString());
    savedUser.walletAddress = walletAddress;
    await savedUser.save();

    // Generate and send OTP for email verification
    const otp = generateOTP();
    await Otp.create({ email, otp, purpose: "registration" });
    await sendOTP(email, otp, "registration");

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find the latest valid OTP
    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "registration",
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Clean up used OTP
    await Otp.deleteMany({ email, purpose: "registration" });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          faceSetupComplete: user.faceSetupComplete,
        },
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login — step 1: validate credentials and send OTP
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    // Generate and send login OTP
    const otp = generateOTP();
    await Otp.create({ email, otp, purpose: "login" });
    await sendOTP(email, otp, "login");

    res.json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      data: { email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/verify-login
 * @desc    Login — step 2: verify OTP and return JWT
 * @access  Public
 */
const verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "login",
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clean up
    await Otp.deleteMany({ email, purpose: "login" });

    const user = await User.findOne({ email }).select("-password");
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isApproved: user.isApproved,
          faceSetupComplete: user.faceSetupComplete,
        },
      },
    });
  } catch (error) {
    console.error("Login verification error:", error);
    res.status(500).json({
      success: false,
      message: "Login verification failed",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for any purpose
 * @access  Public
 */
const resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Email and purpose are required",
      });
    }

    // Clear previous OTPs for this purpose
    await Otp.deleteMany({ email, purpose });

    const otp = generateOTP();
    await Otp.create({ email, otp, purpose });
    await sendOTP(email, otp, purpose);

    res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/setup-face
 * @desc    Capture face embedding from webcam image (separate step after registration)
 * @access  Private (authenticated)
 */
const setupFace = async (req, res) => {
  try {
    const { image } = req.body; // base64 image

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Face image is required",
      });
    }

    // Call AI service to generate face embedding
    const embedding = await generateEmbedding(image);

    if (!embedding || embedding.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not detect face in image. Please try again.",
      });
    }

    // Encrypt and store embedding
    const encryptedEmbedding = encryptEmbedding(embedding);

    await User.findByIdAndUpdate(req.user._id, {
      faceEmbedding: encryptedEmbedding,
      faceSetupComplete: true,
    });

    res.json({
      success: true,
      message: "Face setup completed successfully",
    });
  } catch (error) {
    console.error("Face setup error:", error);
    res.status(500).json({
      success: false,
      message: "Face setup failed",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -faceEmbedding");
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  verifyLogin,
  resendOtp,
  setupFace,
  getMe,
};
