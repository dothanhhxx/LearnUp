"""
LearnUP API — FastAPI Application Entry Point.
Chỉ khởi tạo app, mount middleware & routers.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import articles, users, tags, vocabulary, upload
from config.settings import APP_HOST, APP_PORT

app = FastAPI(
    title="LearnUp API",
    version="2.0.0",
    description="English Learning Platform API — Router-Service-Repository Architecture",
    redirect_slashes=False,
)

# ===== CORS — cho phép frontend gọi API =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên giới hạn domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Serve uploaded files =====
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ===== Mount Routers =====
app.include_router(users.router)
app.include_router(articles.router)
app.include_router(tags.router)
app.include_router(vocabulary.router)
app.include_router(upload.router)


# ===== Health Check =====
@app.get("/api/health", tags=["System"])
def health_check():
    """API health check endpoint."""
    return {
        "status": "OK",
        "message": "LearnUp API is running (FastAPI v2.0 — Layered Architecture).",
        "version": "2.0.0"
    }


# ===== Entry Point =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
