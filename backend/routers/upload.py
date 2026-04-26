"""
Upload Router — Endpoint upload file ảnh cho articles.
File được lưu vào thư mục uploads/ và trả về URL tương đối.
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/upload", tags=["Upload"])

# Thư mục lưu file upload (tương đối so với thư mục backend)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Các loại file được phép
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".pdf", ".bmp", ".tiff"
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("")
@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    admin=Depends(require_admin)
):
    """Upload file ảnh hoặc PDF cho article (admin only). Trả về URL để dùng trong article."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size is 10 MB.")

    # Tạo tên file unique để tránh conflict
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # URL public (được serve bởi StaticFiles mount trong main.py)
    url = f"/uploads/{unique_name}"

    return {
        "success": True,
        "url": url,
        "filename": unique_name,
        "original_name": file.filename,
        "size": len(content),
    }
