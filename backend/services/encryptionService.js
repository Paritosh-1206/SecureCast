// services/encryptionService.js — AES-256 encryption/decryption for sensitive data
const CryptoJS = require("crypto-js");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypt a plaintext string using AES-256
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted ciphertext string
 */
const encrypt = (text) => {
  if (!text) return null;
  const ciphertext = CryptoJS.AES.encrypt(
    text.toString(),
    ENCRYPTION_KEY
  ).toString();
  return ciphertext;
};

/**
 * Decrypt an AES-256 encrypted string
 * @param {string} ciphertext - Encrypted string
 * @returns {string} Decrypted plaintext
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null;
  }
};

/**
 * Encrypt a face embedding array (convert to JSON string first)
 * @param {number[]} embedding - Array of floats
 * @returns {string} Encrypted embedding string
 */
const encryptEmbedding = (embedding) => {
  if (!embedding) return null;
  const jsonString = JSON.stringify(embedding);
  return encrypt(jsonString);
};

/**
 * Decrypt a face embedding back to float array
 * @param {string} encryptedEmbedding - Encrypted embedding string
 * @returns {number[]} Decrypted float array
 */
const decryptEmbedding = (encryptedEmbedding) => {
  if (!encryptedEmbedding) return null;
  const jsonString = decrypt(encryptedEmbedding);
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

module.exports = { encrypt, decrypt, encryptEmbedding, decryptEmbedding };
