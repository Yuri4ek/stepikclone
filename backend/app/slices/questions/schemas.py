from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AskIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class AnswerIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class QuestionOut(BaseModel):
    id: UUID
    step_id: UUID
    step_title: str
    course_id: UUID
    course_title: str
    student: dict
    text: str
    status: str
    answer: str | None
    answered_by: dict | None
    created_at: datetime | None
    answered_at: datetime | None


class QuestionListOut(BaseModel):
    items: list[QuestionOut]
    total: int
    open: int
