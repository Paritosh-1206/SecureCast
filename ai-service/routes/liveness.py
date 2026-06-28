# routes/liveness.py — Liveness detection endpoint
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.liveness_detector import detect_liveness

router = APIRouter()


class LivenessRequest(BaseModel):
    frames: List[str]  # Array of base64-encoded video frames


class LivenessResponse(BaseModel):
    passed: bool
    blink_detected: bool
    yaw_detected: bool
    blink_count: int
    max_yaw: float
    frames_analyzed: int
    details: str


@router.post("/liveness", response_model=LivenessResponse)
async def check_liveness(request: LivenessRequest):
    """
    Perform liveness detection on a sequence of video frames.

    Analyzes the frames for:
    1. Eye blinks (using Eye Aspect Ratio)
    2. Head yaw movement (left-right head turns)

    Both checks must pass for liveness to be confirmed.
    Minimum 5 frames required.
    """
    if len(request.frames) < 5:
        raise HTTPException(
            status_code=400,
            detail="At least 5 video frames are required for liveness detection",
        )

    try:
        result = detect_liveness(request.frames)
        return LivenessResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Liveness detection failed: {str(e)}",
        )
