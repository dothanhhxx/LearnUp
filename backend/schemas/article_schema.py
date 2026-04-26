"""
Article Schemas — Request/Response models cho Articles.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ArticleResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[str] = None
    difficulty: Optional[str] = 'Beginner'
    tags: List[str] = []


class ArticleCreateRequest(BaseModel):
    title: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    difficulty: Optional[str] = 'Beginner'
    tag_ids: List[int] = []


class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    difficulty: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class ArticlesListResponse(BaseModel):
    success: bool = True
    data: List[ArticleResponse]
    total: int
