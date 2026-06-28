# services/face_verify.py — Face verification using cosine similarity
import numpy as np
from scipy.spatial.distance import cosine
from services.face_embedding import generate_embedding
import os

# Default similarity threshold
DEFAULT_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.6"))


def cosine_similarity(embedding1: list, embedding2: list) -> float:
    """
    Compute cosine similarity between two face embeddings.

    Args:
        embedding1: First face embedding (list of floats)
        embedding2: Second face embedding (list of floats)

    Returns:
        float: Similarity score between 0 and 1 (higher = more similar)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)

    # cosine() from scipy returns distance, we want similarity
    similarity = 1 - cosine(vec1, vec2)

    return float(similarity)


def verify_face(
    base64_image: str,
    stored_embedding: list,
    threshold: float = None,
) -> dict:
    """
    Verify a face image against a stored embedding.

    Generates an embedding from the input image and compares it
    to the stored embedding using cosine similarity.

    Args:
        base64_image: Base64-encoded face image to verify
        stored_embedding: Previously stored face embedding (list of floats)
        threshold: Minimum similarity score to consider a match (default 0.6)

    Returns:
        dict: {
            "verified": bool,
            "similarity": float,
            "threshold": float
        }
    """
    if threshold is None:
        threshold = DEFAULT_THRESHOLD

    # Generate embedding for the input image
    current_embedding = generate_embedding(base64_image)

    # Calculate cosine similarity
    similarity = cosine_similarity(current_embedding, stored_embedding)

    return {
        "verified": similarity >= threshold,
        "similarity": round(similarity, 4),
        "threshold": threshold,
    }
