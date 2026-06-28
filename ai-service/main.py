# main.py — SecureCast AI Face Verification Service
# FastAPI application for face embedding, verification, and liveness detection

import os
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.embedding import router as embedding_router
from routes.verify import router as verify_router
from routes.liveness import router as liveness_router

# ──────────────── App Setup ────────────────
app = FastAPI(
    title="SecureCast AI Service",
    description="Face verification and liveness detection API for SecureCast voting system",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────── Routes ────────────────
app.include_router(embedding_router, prefix="/api", tags=["Face Embedding"])
app.include_router(verify_router, prefix="/api", tags=["Face Verification"])
app.include_router(liveness_router, prefix="/api", tags=["Liveness Detection"])


# ──────────────── Health Check ────────────────
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "SecureCast AI Service",
        "version": "1.0.0",
    }


# ──────────────── Startup Event ────────────────
@app.on_event("startup")
async def startup_event():
    """Pre-load ML models on startup for faster first request."""
    print("[AI] SecureCast AI Service starting...")
    print("   Loading face recognition models...")

    try:
        # Pre-load DeepFace model by running a dummy inference
        from deepface import DeepFace
        import numpy as np

        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
        try:
            DeepFace.represent(
                img_path=dummy_img,
                model_name=os.getenv("RECOGNITION_MODEL", "Facenet512"),
                detector_backend=os.getenv("DETECTOR_BACKEND", "opencv"),
                enforce_detection=False,
            )
            print("   [OK] Face recognition model loaded")
        except Exception:
            print("   [WARN] Model pre-loading skipped (will load on first request)")

        print(f"[OK] AI Service ready on port {os.getenv('AI_SERVICE_PORT', 8000)}")
    except Exception as e:
        print(f"   [WARN] Startup warning: {e}")


# ──────────────── Run ────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
