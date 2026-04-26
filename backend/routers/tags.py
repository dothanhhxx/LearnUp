"""
Tags Router — API endpoints cho Tags.
"""
from fastapi import APIRouter, Depends
from config.database import get_db
from schemas.tag_schema import TagCreateRequest, TagUpdateRequest
from services import tag_service
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/tags", tags=["Tags"])


@router.get("")
@router.get("/")
def get_all_tags(conn=Depends(get_db)):
    """Lấy danh sách tất cả tags kèm số lượng bài viết (public)."""
    return tag_service.get_all(conn)


@router.post("")
@router.post("/")
def create_tag(
    request: TagCreateRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Tạo tag mới (admin only)."""
    return tag_service.create_tag(request.name, conn)


@router.put("/{tag_id}")
def update_tag(
    tag_id: int,
    request: TagUpdateRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Đổi tên tag (admin only)."""
    return tag_service.update_tag(tag_id, request.name, conn)


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Xóa tag (admin only)."""
    return tag_service.delete_tag(tag_id, conn)

