# services/liveness_detector.py — Blink and Yaw liveness detection using MediaPipe Tasks API
import os
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from utils.image_utils import base64_to_image
import cv2

# Path to the face landmarker model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "face_landmarker.task")

# ──────────── Eye Aspect Ratio (EAR) Landmarks ────────────
# Right eye landmarks (MediaPipe Face Mesh indices)
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
# Left eye landmarks
LEFT_EYE = [362, 385, 387, 263, 373, 380]

# EAR threshold for blink detection
EAR_THRESHOLD = 0.21
# Minimum number of frames where EAR is below threshold to count as a blink
BLINK_CONSEC_FRAMES = 2

# ──────────── Yaw Detection ────────────
# Nose tip landmark
NOSE_TIP = 1
# Left cheek and right cheek for face width reference
LEFT_CHEEK = 234
RIGHT_CHEEK = 454

# Yaw threshold — ratio of nose displacement relative to face width
YAW_THRESHOLD = 0.15


def calculate_ear(landmarks, eye_indices, img_w, img_h):
    """
    Calculate Eye Aspect Ratio (EAR) for a given eye.

    EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)

    Where p1-p6 are the 6 eye landmarks in order:
    p1 = outer corner, p2 = upper outer, p3 = upper inner,
    p4 = inner corner, p5 = lower inner, p6 = lower outer

    Args:
        landmarks: MediaPipe face landmarks (NormalizedLandmark list)
        eye_indices: List of 6 landmark indices for the eye
        img_w: Image width
        img_h: Image height

    Returns:
        float: Eye Aspect Ratio
    """
    coords = []
    for idx in eye_indices:
        lm = landmarks[idx]
        coords.append([lm.x * img_w, lm.y * img_h])

    coords = np.array(coords, dtype=np.float64)

    # Compute distances
    # Vertical distances
    d1 = np.linalg.norm(coords[1] - coords[5])  # p2 - p6
    d2 = np.linalg.norm(coords[2] - coords[4])  # p3 - p5
    # Horizontal distance
    d3 = np.linalg.norm(coords[0] - coords[3])  # p1 - p4

    if d3 == 0:
        return 0.0

    ear = (d1 + d2) / (2.0 * d3)
    return ear


def calculate_yaw(landmarks, img_w):
    """
    Calculate yaw (horizontal head turn) from face landmarks.

    Measures the relative position of the nose tip between
    the left and right cheek landmarks.

    Args:
        landmarks: MediaPipe face landmarks (NormalizedLandmark list)
        img_w: Image width

    Returns:
        float: Yaw value. Negative = looking left, Positive = looking right.
               Values near 0 = looking straight ahead.
    """
    nose_x = landmarks[NOSE_TIP].x * img_w
    left_x = landmarks[LEFT_CHEEK].x * img_w
    right_x = landmarks[RIGHT_CHEEK].x * img_w

    face_width = abs(right_x - left_x)
    if face_width == 0:
        return 0.0

    # Center of face
    center_x = (left_x + right_x) / 2.0

    # Displacement from center, normalized by face width
    yaw = (nose_x - center_x) / face_width

    return yaw


def detect_liveness(base64_frames: list) -> dict:
    """
    Perform liveness detection on a sequence of video frames.

    Checks for:
    1. Blink detection: Detects natural eye blinks using EAR
    2. Yaw detection: Detects head turning left/right

    Both checks must pass for liveness to be confirmed.

    Args:
        base64_frames: List of base64-encoded image frames (min 5 frames)

    Returns:
        dict: {
            "passed": bool,
            "blink_detected": bool,
            "yaw_detected": bool,
            "blink_count": int,
            "max_yaw": float,
            "frames_analyzed": int,
            "details": str
        }
    """
    blink_detected = False
    yaw_detected = False
    blink_count = 0
    max_yaw = 0.0
    frames_below_ear = 0
    was_below = False

    # Configure the FaceLandmarker with the Tasks API
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    with vision.FaceLandmarker.create_from_options(options) as landmarker:

        for i, frame_b64 in enumerate(base64_frames):
            try:
                # Convert base64 to image
                img = base64_to_image(frame_b64)
                img_h, img_w = img.shape[:2]

                # Convert BGR to RGB for MediaPipe
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

                # Create MediaPipe Image
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

                # Process with MediaPipe Tasks API
                results = landmarker.detect(mp_image)

                if not results.face_landmarks:
                    continue

                landmarks = results.face_landmarks[0]

                # ──── Blink detection ────
                left_ear = calculate_ear(landmarks, LEFT_EYE, img_w, img_h)
                right_ear = calculate_ear(landmarks, RIGHT_EYE, img_w, img_h)
                avg_ear = (left_ear + right_ear) / 2.0

                if avg_ear < EAR_THRESHOLD:
                    frames_below_ear += 1
                else:
                    if frames_below_ear >= BLINK_CONSEC_FRAMES:
                        blink_count += 1
                        blink_detected = True
                    frames_below_ear = 0

                # ──── Yaw detection ────
                yaw_value = calculate_yaw(landmarks, img_w)
                abs_yaw = abs(yaw_value)

                if abs_yaw > max_yaw:
                    max_yaw = abs_yaw

                if abs_yaw > YAW_THRESHOLD:
                    yaw_detected = True

            except Exception as e:
                print(f"Frame {i} processing error: {e}")
                continue

    # Check final blink state
    if frames_below_ear >= BLINK_CONSEC_FRAMES:
        blink_count += 1
        blink_detected = True

    passed = blink_detected and yaw_detected

    # Build details message
    details_parts = []
    if blink_detected:
        details_parts.append(f"Blink detected ({blink_count} blink(s))")
    else:
        details_parts.append("No blink detected — please blink naturally")
    if yaw_detected:
        details_parts.append(f"Head turn detected (max yaw: {max_yaw:.3f})")
    else:
        details_parts.append(
            f"No head turn detected (max yaw: {max_yaw:.3f}) — please turn your head left or right"
        )

    return {
        "passed": passed,
        "blink_detected": blink_detected,
        "yaw_detected": yaw_detected,
        "blink_count": blink_count,
        "max_yaw": round(max_yaw, 4),
        "frames_analyzed": len(base64_frames),
        "details": " | ".join(details_parts),
    }
