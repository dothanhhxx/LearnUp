"""
Tag Repository — Data access layer cho bảng tags.
"""
from typing import Optional, Dict, List


def find_all(conn) -> List[Dict]:
    """Lấy tất cả tags kèm số lượng bài viết."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT t.id, t.name, COUNT(at2.article_id) AS article_count
            FROM tags t
            LEFT JOIN article_tags at2 ON t.id = at2.tag_id
            GROUP BY t.id
            ORDER BY article_count DESC, t.name ASC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()


def find_by_id(conn, tag_id: int) -> Optional[Dict]:
    """Tìm tag theo ID."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name FROM tags WHERE id = %s", (tag_id,))
        return cursor.fetchone()
    finally:
        cursor.close()


def create(conn, name: str) -> int:
    """Tạo tag mới, trả về ID."""
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO tags (name) VALUES (%s)", (name,))
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()


def delete(conn, tag_id: int) -> bool:
    """Xóa tag theo ID."""
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tags WHERE id = %s", (tag_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()


def update(conn, tag_id: int, name: str) -> bool:
    """Đổi tên tag theo ID."""
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE tags SET name = %s WHERE id = %s", (name, tag_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()

