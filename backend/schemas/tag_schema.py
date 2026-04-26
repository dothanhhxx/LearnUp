"""
Tag Schemas — Request/Response models cho Tags.
"""
from pydantic import BaseModel
from typing import List, Optional


class TagResponse(BaseModel):
    id: int
    name: str
    article_count: int = 0


class TagCreateRequest(BaseModel):
    name: str


class TagUpdateRequest(BaseModel):
    name: str


class TagsListResponse(BaseModel):
    success: bool = True
    data: List[TagResponse]
    total: int
