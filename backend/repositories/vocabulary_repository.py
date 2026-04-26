"""
Vocabulary Repository — Data access layer cho bảng vocabularies.
"""
from typing import Optional, Dict, List
import uuid


def find_by_user(conn, user_id: int) -> List[Dict]:
    """Lấy tất cả từ vựng của user."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT v.id, v.word, v.phonetic, v.definition, v.example,
                   v.vietnamese, v.article_id, v.created_at,
                   a.title AS article_title
            FROM vocabularies v
            LEFT JOIN articles a ON v.article_id = a.id
            WHERE v.user_id = %s
            ORDER BY v.created_at DESC
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()


def find_by_id(conn, vocab_id: str) -> Optional[Dict]:
    """Tìm từ vựng theo ID."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM vocabularies WHERE id = %s", (vocab_id,))
        return cursor.fetchone()
    finally:
        cursor.close()


def create(conn, user_id: int, word: str, article_id: str = None,
           phonetic: str = None, definition: str = None, example: str = None,
           vietnamese: str = None) -> str:
    """Lưu từ vựng mới, trả về ID (UUID)."""
    cursor = conn.cursor()
    try:
        vocab_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO vocabularies (id, user_id, word, article_id, phonetic, definition, example, vietnamese)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (vocab_id, user_id, word, article_id, phonetic, definition, example, vietnamese)
        )
        conn.commit()
        return vocab_id
    finally:
        cursor.close()


def delete(conn, vocab_id: str, user_id: int) -> bool:
    """Xóa từ vựng (chỉ owner)."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM vocabularies WHERE id = %s AND user_id = %s",
            (vocab_id, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()


def check_duplicate(conn, user_id: int, word: str) -> bool:
    """Kiểm tra từ đã được lưu chưa."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT COUNT(*) FROM vocabularies WHERE user_id = %s AND LOWER(word) = LOWER(%s)",
            (user_id, word)
        )
        count = cursor.fetchone()[0]
        return count > 0
    finally:
        cursor.close()
