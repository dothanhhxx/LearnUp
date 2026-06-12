"""
Vocabulary Service — Business logic cho Vocabulary.
"""
from repositories import vocabulary_repository, user_repository
from utils.exceptions import NotFoundException, ConflictException, UnauthorizedException


def get_user_vocab(user_id, conn):
    """Lấy danh sách từ vựng của user."""
    user_id = int(user_id)  # JWT sub có thể là int hoặc float — chuẩn hóa
    vocabs = vocabulary_repository.find_by_user(conn, user_id)

    for vocab in vocabs:
        if vocab.get("created_at"):
            vocab["created_at"] = vocab["created_at"].isoformat()

    return {"success": True, "data": vocabs, "total": len(vocabs)}


def save_word(user_id, word: str, article_id: str, conn,
              phonetic: str = None, definition: str = None, example: str = None,
              vietnamese: str = None):
    """Lưu từ vựng mới cho user (bao gồm phonetic, definition, example, vietnamese)."""
    user_id = int(user_id)  # chuẩn hóa từ JWT sub (có thể là float)

    # Xác minh user tồn tại trong DB — tránh FK constraint crash
    user = user_repository.find_by_id(conn, user_id)
    if not user:
        raise UnauthorizedException("User account not found. Please log in again.")

    if not word or not word.strip():
        raise ValueError("Word cannot be empty.")

    word = word.strip().lower()

    # Kiểm tra duplicate (case-insensitive)
    if vocabulary_repository.check_duplicate(conn, user_id, word):
        raise ConflictException(f"Word '{word}' already saved in your dictionary.")

    vocab_id = vocabulary_repository.create(
        conn, user_id, word, article_id,
        phonetic=phonetic, definition=definition, example=example,
        vietnamese=vietnamese
    )
    return {"success": True, "message": f"'{word}' saved to your dictionary.", "id": vocab_id}


def delete_word(vocab_id: str, user_id, conn):
    """Xóa từ vựng (chỉ owner)."""
    user_id = int(user_id)  # chuẩn hóa từ JWT sub
    deleted = vocabulary_repository.delete(conn, vocab_id, user_id)
    if not deleted:
        raise NotFoundException("Vocabulary not found or you don't have permission.")
    return {"success": True, "message": "Word deleted"}
