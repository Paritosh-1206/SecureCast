// services/faceService.js — Proxy to Python AI face verification API
const axios = require("axios");

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Generate a face embedding from a base64 image
 * @param {string} imageBase64 - Base64-encoded face image (no data URI prefix)
 * @returns {number[]} 512-dimensional face embedding array
 */
const generateEmbedding = async (imageBase64) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/api/embedding`,
      { image: imageBase64 },
      { timeout: 30000 }
    );
    return response.data.embedding;
  } catch (error) {
    const msg = error.response?.data?.detail || error.message;
    throw new Error(`Face embedding generation failed: ${msg}`);
  }
};

/**
 * Verify a face against a stored embedding using cosine similarity
 * @param {string} imageBase64 - Base64 image of the face to verify
 * @param {number[]} storedEmbedding - Previously stored face embedding
 * @param {number} threshold - Similarity threshold (default 0.6)
 * @returns {object} { verified: boolean, similarity: number }
 */
const verifyFace = async (imageBase64, storedEmbedding, threshold = 0.6) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/api/verify`,
      {
        image: imageBase64,
        stored_embedding: storedEmbedding,
        threshold,
      },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.detail || error.message;
    throw new Error(`Face verification failed: ${msg}`);
  }
};

/**
 * Perform liveness detection on a sequence of video frames
 * @param {string[]} frames - Array of base64-encoded video frames
 * @returns {object} { passed: boolean, blink_detected: boolean, yaw_detected: boolean, details: string }
 */
const checkLiveness = async (frames) => {
  try {
    const response = await axios.post(
      `${AI_BASE_URL}/api/liveness`,
      { frames },
      { timeout: 60000 }
    );
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.detail || error.message;
    throw new Error(`Liveness check failed: ${msg}`);
  }
};

/**
 * Health check for the AI service
 * @returns {boolean} true if AI service is available
 */
const healthCheck = async () => {
  try {
    const response = await axios.get(`${AI_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.data.status === "ok";
  } catch {
    return false;
  }
};

module.exports = { generateEmbedding, verifyFace, checkLiveness, healthCheck };
