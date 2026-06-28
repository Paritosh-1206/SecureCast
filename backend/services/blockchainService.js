// services/blockchainService.js — Smart contract deployment & interaction
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { getAdminWallet, getProvider } = require("../config/blockchain");

// Load the compiled contract ABI and bytecode
const getContractArtifact = () => {
  const artifactPath = path.join(
    __dirname,
    "../../blockchain/artifacts/contracts/Election.sol/Election.json"
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Election contract artifact not found. Run 'npx hardhat compile' in the blockchain directory first."
    );
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
};

/**
 * Deploy a new Election smart contract
 * @param {string} title - Election title
 * @param {number} candidateCount - Number of approved candidates
 * @returns {string} Deployed contract address
 */
const deployElectionContract = async (title, candidateCount) => {
  const wallet = getAdminWallet();
  const artifact = getContractArtifact();

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  console.log(`🚀 Deploying Election contract: "${title}" with ${candidateCount} candidates...`);
  const contract = await factory.deploy(title, candidateCount);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ Election contract deployed at: ${address}`);
  return address;
};

/**
 * Get a contract instance connected to the admin wallet
 * @param {string} contractAddress - Deployed contract address
 * @returns {ethers.Contract} Contract instance
 */
const getElectionContract = (contractAddress) => {
  const wallet = getAdminWallet();
  const artifact = getContractArtifact();
  return new ethers.Contract(contractAddress, artifact.abi, wallet);
};

/**
 * Start an election on the blockchain
 * @param {string} contractAddress - Contract address
 */
const startElection = async (contractAddress) => {
  const contract = getElectionContract(contractAddress);
  const tx = await contract.startElection();
  await tx.wait();
  console.log(`✅ Election started on-chain: ${contractAddress}`);
};

/**
 * End an election on the blockchain
 * @param {string} contractAddress - Contract address
 */
const endElection = async (contractAddress) => {
  const contract = getElectionContract(contractAddress);
  const tx = await contract.endElection();
  await tx.wait();
  console.log(`✅ Election ended on-chain: ${contractAddress}`);
};

/**
 * Cast a vote on the blockchain
 * @param {string} contractAddress - Contract address
 * @param {number} candidateId - 1-indexed candidate ID
 * @param {string} voteHash - keccak256 hash of vote data
 * @param {string} voterAddress - Ethereum address representing the voter
 * @returns {object} Transaction receipt
 */
const castVoteOnChain = async (contractAddress, candidateId, voteHash, voterAddress) => {
  const contract = getElectionContract(contractAddress);
  const tx = await contract.castVote(candidateId, voteHash, voterAddress);
  const receipt = await tx.wait();
  console.log(`✅ Vote cast on-chain: tx=${receipt.hash}`);
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

/**
 * Get election results from the blockchain
 * @param {string} contractAddress - Contract address
 * @returns {number[]} Array of vote counts per candidate
 */
const getElectionResults = async (contractAddress) => {
  const contract = getElectionContract(contractAddress);
  const results = await contract.getResults();
  return results.map((r) => Number(r));
};

/**
 * Check if a voter has already voted on-chain
 * @param {string} contractAddress - Contract address
 * @param {string} voterAddress - Voter's wallet address
 * @returns {boolean}
 */
const hasVoterVoted = async (contractAddress, voterAddress) => {
  const contract = getElectionContract(contractAddress);
  return await contract.hasVoterVoted(voterAddress);
};

/**
 * Get election info from the blockchain
 * @param {string} contractAddress - Contract address
 */
const getElectionInfo = async (contractAddress) => {
  const contract = getElectionContract(contractAddress);
  const info = await contract.getElectionInfo();
  return {
    title: info.title,
    candidateCount: Number(info.candidates),
    isActive: info.active,
    resultsPublished: info.published,
    totalVotes: Number(info.votes),
  };
};

/**
 * Publish results on the blockchain
 * @param {string} contractAddress - Contract address
 */
const publishResults = async (contractAddress) => {
  const contract = getElectionContract(contractAddress);
  const tx = await contract.publishResults();
  await tx.wait();
  console.log(`✅ Results published on-chain: ${contractAddress}`);
};

/**
 * Generate a deterministic wallet address for a voter
 * Uses the voter's MongoDB ID to create a deterministic address.
 * This is for tracking purposes only — the backend wallet submits all txs.
 * @param {string} odId - Voter's MongoDB ObjectId string
 * @returns {string} Ethereum address
 */
const generateVoterAddress = (odId) => {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(odId));
  // Take first 20 bytes of hash as address
  return ethers.getAddress("0x" + hash.slice(26));
};

module.exports = {
  deployElectionContract,
  getElectionContract,
  startElection,
  endElection,
  castVoteOnChain,
  getElectionResults,
  hasVoterVoted,
  getElectionInfo,
  publishResults,
  generateVoterAddress,
};
