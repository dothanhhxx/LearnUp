"""
Quiz Schemas — Placeholder cho tính năng Quiz.
Sẽ implement chi tiết khi phát triển tính năng.
"""
from pydantic import BaseModel
from typing import List, Optional


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[str] = []


class QuizSubmitRequest(BaseModel):
    question_id: int
    selected_answer: str


class QuizAttemptResponse(BaseModel):
    id: int
    total_questions: int
    correct_answers: int
    score_percent: float
