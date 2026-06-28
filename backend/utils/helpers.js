// utils/helpers.js — Shared utility functions
const { ethers } = require("ethers");

/**
 * Generate a keccak256 vote hash for on-chain storage
 * @param {string} odId - Voter's user ID
 * @param {string} electionId - Election ID
 * @param {number} candidateId - Candidate number
 * @returns {string} bytes32 hash string
 */
const generateVoteHash = (odId, electionId, candidateId) => {
  const salt = Date.now().toString();
  const data = `${odId}-${electionId}-${candidateId}-${salt}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate age from date of birth
 * @param {Date} dob
 * @returns {number} Age in years
 */
const calculateAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

module.exports = { generateVoteHash, isValidEmail, calculateAge };
