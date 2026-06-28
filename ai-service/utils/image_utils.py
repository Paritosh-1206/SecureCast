# utils/image_utils.py — Image conversion and processing utilities
import base64
import io
import numpy as np
from PIL import Image
import cv2


def base64_to_image(base64_string: str) -> np.ndarray:
    """
    Convert a base64-encoded image string to an OpenCV BGR numpy array.
    Handles both raw base64 and data URI format (data:image/...;base64,...).
    """
    # Remove data URI prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_string)

    # Convert to PIL Image
    pil_image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB numpy array
    rgb_array = np.array(pil_image.convert("RGB"))

    # Convert RGB to BGR for OpenCV
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)

    return bgr_array


def base64_to_rgb(base64_string: str) -> np.ndarray:
    """
    Convert a base64-encoded image string to an RGB numpy array.
    Used by DeepFace which expects RGB input.
    """
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(io.BytesIO(image_bytes))
    rgb_array = np.array(pil_image.convert("RGB"))

    return rgb_array


def image_to_base64(image: np.ndarray) -> str:
    """
    Convert an OpenCV BGR image to a base64-encoded JPEG string.
    """
    _, buffer = cv2.imencode(".jpg", image)
    base64_string = base64.b64encode(buffer).decode("utf-8")
    return base64_string
