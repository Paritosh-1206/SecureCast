// config/blockchain.js — Ethers.js provider & wallet setup
const { ethers } = require("ethers");

let provider;
let adminWallet;

/**
 * Initialize the blockchain provider and admin wallet.
 * Called once on server startup.
 */
const initBlockchain = () => {
  try {
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log(`✅ Blockchain connected: ${process.env.BLOCKCHAIN_RPC_URL}`);
    console.log(`   Admin wallet: ${adminWallet.address}`);
  } catch (error) {
    console.error(`❌ Blockchain init error: ${error.message}`);
  }
};

const getProvider = () => provider;
const getAdminWallet = () => adminWallet;

module.exports = { initBlockchain, getProvider, getAdminWallet };
