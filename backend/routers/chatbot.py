from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from services.chatbot_service import ChatbotService
from middleware.auth_middleware import get_current_user
from config.database import get_db

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

class ChatMessage(BaseModel):
    message: str
    context: Optional[dict] = None

@router.post("/chat")
def chat_with_ai(
    chat: ChatMessage, 
    current_user: dict = Depends(get_current_user),
    conn = Depends(get_db)
):
    """
    Endpoint for the AI Chatbot.
    Requires authentication (handled by get_current_user).
    """
    if not chat.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    try:
        response_text = ChatbotService.get_response(
            user_message=chat.message, 
            context=chat.context, 
            current_user=current_user, 
            conn=conn
        )
        return {"success": True, "data": {"response": response_text}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot failed to respond: {str(e)}"
        )
