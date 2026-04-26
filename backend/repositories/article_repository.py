"""
Article Repository — Data access layer cho bảng articles.
Chỉ chứa SQL queries, KHÔNG có business logic.
"""
from typing import Optional, Dict, List
import uuid


def find_all(conn) -> List[Dict]:
    """Lấy tất cả articles kèm tags."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT a.id, a.title, a.content, a.image_url, a.created_at, a.difficulty,
                   GROUP_CONCAT(t.name) AS tags
            FROM articles a
            LEFT JOIN article_tags at2 ON a.id = at2.article_id
            LEFT JOIN tags t ON at2.tag_id = t.id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()


def find_by_id(conn, article_id: str) -> Optional[Dict]:
    """Lấy article theo ID kèm tags."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT a.id, a.title, a.content, a.image_url, a.created_at, a.difficulty,
                   GROUP_CONCAT(t.name) AS tags
            FROM articles a
            LEFT JOIN article_tags at2 ON a.id = at2.article_id
            LEFT JOIN tags t ON at2.tag_id = t.id
            WHERE a.id = %s
            GROUP BY a.id
        """, (article_id,))
        return cursor.fetchone()
    finally:
        cursor.close()


def create(conn, title: str, content: str = None, image_url: str = None,
           difficulty: str = 'Beginner', tag_ids: list = None) -> str:
    """Tạo article mới, trả về ID (UUID)."""
    cursor = conn.cursor()
    try:
        article_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO articles (id, title, content, image_url, difficulty) VALUES (%s, %s, %s, %s, %s)",
            (article_id, title, content, image_url, difficulty or 'Beginner')
        )

        # Gắn tags
        if tag_ids:
            for tag_id in tag_ids:
                cursor.execute(
                    "INSERT INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                    (article_id, tag_id)
                )

        conn.commit()
        return article_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def update(conn, article_id: str, title: str = None, content: str = None,
           image_url: str = None, difficulty: str = None, tag_ids: list = None) -> bool:
    """Cập nhật article, trả về True nếu thành công."""
    cursor = conn.cursor()
    try:
        # Build dynamic SET clause
        fields = []
        values = []
        if title is not None:
            fields.append("title = %s")
            values.append(title)
        if content is not None:
            fields.append("content = %s")
            values.append(content)
        if image_url is not None:
            fields.append("image_url = %s")
            values.append(image_url)
        if difficulty is not None:
            fields.append("difficulty = %s")
            values.append(difficulty)

        if fields:
            values.append(article_id)
            cursor.execute(
                f"UPDATE articles SET {', '.join(fields)} WHERE id = %s",
                tuple(values)
            )

        # Update tags nếu có
        if tag_ids is not None:
            cursor.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
            for tag_id in tag_ids:
                cursor.execute(
                    "INSERT INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                    (article_id, tag_id)
                )

        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def delete(conn, article_id: str) -> bool:
    """Xóa article theo ID."""
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM articles WHERE id = %s", (article_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
