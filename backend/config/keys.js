// config/keys.js — Centralized environment config
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  encryptionKey: process.env.ENCRYPTION_KEY,
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY,
  },
  aiServiceUrl: process.env.AI_SERVICE_URL,
  frontendUrl: process.env.FRONTEND_URL,
};
