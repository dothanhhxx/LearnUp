from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ===== User Schemas =====
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    userId: int
    email: str
    name: str
    role: str


# ===== Article Schemas =====
class ArticleResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    tags: List[str] = []


class ArticlesListResponse(BaseModel):
    success: bool
    data: List[ArticleResponse]
    total: int
