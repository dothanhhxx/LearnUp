"""
User Repository — Data access layer cho bảng users.
Chỉ chứa SQL queries, KHÔNG có business logic.
"""
from typing import Optional, Dict


def find_by_email(conn, email: str) -> Optional[Dict]:
    """Tìm user theo email."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()


def find_by_id(conn, user_id: int) -> Optional[Dict]:
    """Tìm user theo ID."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, email, name, role, created_at FROM users WHERE id = %s",
            (user_id,)
        )
        return cursor.fetchone()
    finally:
        cursor.close()


def create(conn, email: str, password_hash: str, name: str, role: str = "user") -> int:
    """Tạo user mới, trả về ID."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, name, role) VALUES (%s, %s, %s, %s)",
            (email, password_hash, name, role)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()


def find_all(conn) -> list:
    """Lấy danh sách tất cả users (admin)."""
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC")
        return cursor.fetchall()
    finally:
        cursor.close()


def delete(conn, user_id: int) -> bool:
    """Xóa user theo ID. Trả về True nếu xóa được."""
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()


def get_dashboard_stats(conn, user_id: int) -> dict:
    """Lấy thống kê dashboard cho user: vocab, quiz, articles."""
    cursor = conn.cursor(dictionary=True)
    try:
        # --- Vocabulary stats ---
        cursor.execute(
            "SELECT COUNT(*) AS total_words FROM vocabularies WHERE user_id = %s",
            (user_id,)
        )
        vocab_row = cursor.fetchone()
        total_words = vocab_row["total_words"] if vocab_row else 0

        # Words added today
        cursor.execute(
            """SELECT COUNT(*) AS today_words FROM vocabularies
               WHERE user_id = %s AND DATE(created_at) = CURDATE()""",
            (user_id,)
        )
        today_vocab = cursor.fetchone()
        today_words = today_vocab["today_words"] if today_vocab else 0

        # Words added this week (Mon–Sun)
        cursor.execute(
            """SELECT COUNT(*) AS week_words FROM vocabularies
               WHERE user_id = %s
                 AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)""",
            (user_id,)
        )
        week_vocab = cursor.fetchone()
        week_words = week_vocab["week_words"] if week_vocab else 0

        # Words per day for the last 7 days (for weekly chart)
        cursor.execute(
            """SELECT DATE(created_at) AS day, COUNT(*) AS cnt
               FROM vocabularies
               WHERE user_id = %s AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
               GROUP BY DATE(created_at)""",
            (user_id,)
        )
        word_by_day_rows = cursor.fetchall()
        word_by_day = {str(r["day"]): r["cnt"] for r in word_by_day_rows}

        # --- Quiz stats ---
        cursor.execute(
            """SELECT COUNT(*) AS total_attempts,
                      COALESCE(SUM(correct_answers), 0)   AS total_correct,
                      COALESCE(SUM(total_questions), 0)   AS total_questions
               FROM quiz_attempts WHERE user_id = %s""",
            (user_id,)
        )
        quiz_row = cursor.fetchone()
        total_attempts   = quiz_row["total_attempts"]   if quiz_row else 0
        total_correct    = quiz_row["total_correct"]    if quiz_row else 0
        total_questions  = quiz_row["total_questions"]  if quiz_row else 0

        best_score = None
        if total_attempts > 0:
            cursor.execute(
                """SELECT MAX(ROUND(correct_answers / total_questions * 100)) AS best
                   FROM quiz_attempts WHERE user_id = %s AND total_questions > 0""",
                (user_id,)
            )
            best_row = cursor.fetchone()
            best_score = best_row["best"] if best_row else None

        # Recent quiz attempts
        cursor.execute(
            """SELECT correct_answers, total_questions, ended_at
               FROM quiz_attempts WHERE user_id = %s
               ORDER BY ended_at DESC LIMIT 5""",
            (user_id,)
        )
        recent_attempts = []
        for r in cursor.fetchall():
            pct = round(r["correct_answers"] / r["total_questions"] * 100) if r["total_questions"] else 0
            recent_attempts.append({
                "correct": r["correct_answers"],
                "total":   r["total_questions"],
                "score_pct": pct,
                "ended_at": r["ended_at"].isoformat() if r["ended_at"] else None,
            })

        # --- Recent articles (latest 2 from DB) ---
        cursor.execute(
            """SELECT a.id, a.title, a.difficulty,
                      GROUP_CONCAT(t.name) AS tags
               FROM articles a
               LEFT JOIN article_tags at2 ON a.id = at2.article_id
               LEFT JOIN tags t ON at2.tag_id = t.id
               GROUP BY a.id
               ORDER BY a.created_at DESC LIMIT 2"""
        )
        recent_articles = []
        for r in cursor.fetchall():
            recent_articles.append({
                "id":    r["id"],
                "title": r["title"],
                "difficulty": r["difficulty"] or "Beginner",
                "tags":  r["tags"].split(",") if r["tags"] else [],
            })

        return {
            "vocab": {
                "total":       total_words,
                "today":       today_words,
                "this_week":   week_words,
                "by_day_last7": word_by_day,
            },
            "quiz": {
                "total_attempts":  total_attempts,
                "total_correct":   int(total_correct),
                "total_questions": int(total_questions),
                "best_score_pct":  int(best_score) if best_score is not None else 0,
                "recent_attempts": recent_attempts,
            },
            "recent_articles": recent_articles,
        }
    finally:
        cursor.close()


def update_role(conn, user_id: int, role: str) -> bool:
    """Cập nhật role của user. Trả về True nếu thành công."""
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
