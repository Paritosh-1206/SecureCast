# routes/verify.py — Face verification endpoint
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from services.face_verify import verify_face

router = APIRouter()


class VerifyRequest(BaseModel):
    image: str  # Base64-encoded face image to verify
    stored_embedding: List[float]  # Previously stored face embedding
    threshold: Optional[float] = Field(default=0.6, ge=0.0, le=1.0)


class VerifyResponse(BaseModel):
    verified: bool
    similarity: float
    threshold: float


@router.post("/verify", response_model=VerifyResponse)
async def verify(request: VerifyRequest):
    """
    Verify a face image against a stored embedding.

    Compares the face in the provided image with the stored embedding
    using cosine similarity. Returns whether the face matches.
    """
    try:
        result = verify_face(
            base64_image=request.image,
            stored_embedding=request.stored_embedding,
            threshold=request.threshold,
        )
        return VerifyResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face verification failed: {str(e)}",
        )
