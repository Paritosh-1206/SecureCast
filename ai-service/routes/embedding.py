# routes/embedding.py — Face embedding generation endpoint
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.face_embedding import generate_embedding

router = APIRouter()


class EmbeddingRequest(BaseModel):
    image: str  # Base64-encoded face image


class EmbeddingResponse(BaseModel):
    embedding: list
    dimensions: int


@router.post("/embedding", response_model=EmbeddingResponse)
async def create_embedding(request: EmbeddingRequest):
    """
    Generate a face embedding from a base64-encoded image.

    The embedding is a 512-dimensional float vector that uniquely
    represents the face in the image. Used during face registration.
    """
    try:
        embedding = generate_embedding(request.image)
        return EmbeddingResponse(
            embedding=embedding,
            dimensions=len(embedding),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding generation failed: {str(e)}",
        )
