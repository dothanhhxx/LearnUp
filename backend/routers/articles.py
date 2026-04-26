"""
Articles Router — API endpoints cho Articles.
Thin layer — chỉ nhận request, gọi service, trả response.
"""
from fastapi import APIRouter, Depends
from config.database import get_db
from schemas.article_schema import ArticleCreateRequest, ArticleUpdateRequest
from services import article_service
from middleware.auth_middleware import require_admin

router = APIRouter(prefix="/api/articles", tags=["Articles"])


@router.get("")
@router.get("/")
def get_all_articles(conn=Depends(get_db)):
    """Lấy danh sách tất cả bài viết kèm tags (public)."""
    return article_service.get_all(conn)


@router.get("/{article_id}")
def get_article(article_id: str, conn=Depends(get_db)):
    """Lấy chi tiết bài viết theo ID (public)."""
    return article_service.get_by_id(article_id, conn)


@router.post("")
@router.post("/")
def create_article(
    request: ArticleCreateRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Tạo bài viết mới (admin only)."""
    return article_service.create_article(
        request.title, request.content, request.image_url,
        request.difficulty, request.tag_ids, conn
    )


@router.put("/{article_id}")
def update_article(
    article_id: str,
    request: ArticleUpdateRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Cập nhật bài viết (admin only)."""
    return article_service.update_article(
        article_id, request.title, request.content, request.image_url,
        request.difficulty, request.tag_ids, conn
    )


@router.delete("/{article_id}")
def delete_article(
    article_id: str,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Xóa bài viết (admin only)."""
    return article_service.delete_article(article_id, conn)
