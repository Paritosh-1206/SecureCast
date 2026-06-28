# services/face_embedding.py — Face embedding generation using DeepFace
import numpy as np
from deepface import DeepFace
from utils.image_utils import base64_to_rgb
import os

# Configuration
RECOGNITION_MODEL = os.getenv("RECOGNITION_MODEL", "Facenet512")
DETECTOR_BACKEND = os.getenv("DETECTOR_BACKEND", "opencv")


def generate_embedding(base64_image: str) -> list:
    """
    Generate a face embedding from a base64-encoded image.

    Uses DeepFace with Facenet512 model (produces 512-dimensional embeddings).
    The embedding is a normalized vector representing the face's unique features.

    Args:
        base64_image: Base64-encoded face image string

    Returns:
        list: 512-dimensional float array (face embedding)

    Raises:
        ValueError: If no face is detected in the image
    """
    # Convert base64 to RGB numpy array
    img_array = base64_to_rgb(base64_image)

    try:
        # Generate embedding using DeepFace
        # represent() returns a list of dicts with 'embedding' key
        result = DeepFace.represent(
            img_path=img_array,
            model_name=RECOGNITION_MODEL,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
        )

        if not result or len(result) == 0:
            raise ValueError("No face detected in the image")

        # Return the first face's embedding as a regular Python list
        embedding = result[0]["embedding"]
        return [float(x) for x in embedding]

    except Exception as e:
        error_msg = str(e).lower()
        if "face" in error_msg and ("could not" in error_msg or "no" in error_msg):
            raise ValueError(
                "No face detected in the image. Please ensure your face is clearly visible and well-lit."
            )
        raise e
