"""
Article Service — Business logic cho Articles.
"""
from repositories import article_repository
from utils.exceptions import NotFoundException


def get_all(conn):
    """Lấy tất cả articles, format data trước khi trả về."""
    articles = article_repository.find_all(conn)

    # Format data
    for article in articles:
        article["tags"] = article["tags"].split(",") if article.get("tags") else []
        if article.get("created_at"):
            article["created_at"] = article["created_at"].isoformat()
        # Đảm bảo difficulty luôn có giá trị
        if not article.get("difficulty"):
            article["difficulty"] = "Beginner"

    return {"success": True, "data": articles, "total": len(articles)}


def get_by_id(article_id: str, conn):
    """Lấy article theo ID."""
    article = article_repository.find_by_id(conn, article_id)

    if not article:
        raise NotFoundException(f"Article with id '{article_id}' not found")

    article["tags"] = article["tags"].split(",") if article.get("tags") else []
    if article.get("created_at"):
        article["created_at"] = article["created_at"].isoformat()
    if not article.get("difficulty"):
        article["difficulty"] = "Beginner"

    return {"success": True, "data": article}



def create_article(title: str, content: str, image_url: str, difficulty: str, tag_ids: list, conn):
    """Tạo article mới."""
    article_id = article_repository.create(conn, title, content, image_url, difficulty, tag_ids)
    return {"success": True, "message": "Article created", "id": article_id}


def update_article(article_id: str, title: str, content: str, image_url: str, difficulty: str, tag_ids: list, conn):
    """Cập nhật article."""
    existing = article_repository.find_by_id(conn, article_id)
    if not existing:
        raise NotFoundException(f"Article with id '{article_id}' not found")

    article_repository.update(conn, article_id, title, content, image_url, difficulty, tag_ids)
    return {"success": True, "message": "Article updated"}


def delete_article(article_id: str, conn):
    """Xóa article."""
    deleted = article_repository.delete(conn, article_id)
    if not deleted:
        raise NotFoundException(f"Article with id '{article_id}' not found")

    return {"success": True, "message": "Article deleted"}
