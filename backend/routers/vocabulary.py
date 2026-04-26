"""
Vocabulary Router — API endpoints cho Vocabulary (CRUD).
Tất cả endpoints đều protected — yêu cầu đăng nhập.
"""
from fastapi import APIRouter, Depends
from config.database import get_db
from schemas.vocabulary_schema import VocabCreateRequest
from services import vocabulary_service
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/vocabulary", tags=["Vocabulary"])


@router.get("")
@router.get("/")
def get_my_vocabulary(current_user=Depends(get_current_user), conn=Depends(get_db)):
    """Lấy danh sách từ vựng đã lưu của user hiện tại."""
    return vocabulary_service.get_user_vocab(current_user["sub"], conn)


@router.post("")
@router.post("/")
def save_word(
    request: VocabCreateRequest,
    current_user=Depends(get_current_user),
    conn=Depends(get_db)
):
    """Lưu từ vựng mới kèm definition, phonetic, example, vietnamese."""
    return vocabulary_service.save_word(
        current_user["sub"],
        request.word,
        request.article_id,
        conn,
        phonetic=request.phonetic,
        definition=request.definition,
        example=request.example,
        vietnamese=request.vietnamese,
    )


@router.delete("/{vocab_id}")
def delete_word(
    vocab_id: str,
    current_user=Depends(get_current_user),
    conn=Depends(get_db)
):
    """Xóa từ vựng (chỉ owner)."""
    return vocabulary_service.delete_word(vocab_id, current_user["sub"], conn)
