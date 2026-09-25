from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SubmitIn(BaseModel):
    answers: dict = Field(default_factory=dict)


class StepDetailOut(BaseModel):
    id: UUID
    title: str
    kind: str
    type: str
    max_score: Decimal
    content: dict
    progress: dict


class SubmitOut(BaseModel):
    submission_id: UUID
    check_type: str
    status: str
    step_status: str
    score: Decimal | None
    max_score: Decimal
    feedback: str | None
    result: dict | None = None
    progress_percent: Decimal
    next_step_id: UUID | None = None


class CompleteOut(BaseModel):
    step_id: UUID
    status: str
    progress_percent: Decimal
    rating: dict
    next_step_id: UUID | None = None


class SubmissionOut(BaseModel):
    id: UUID
    step_id: UUID
    check_type: str
    status: str
    score: Decimal | None
    feedback: str | None
    result: dict | None = None
    created_at: str | None
    reviewed_at: str | None


class SubmissionListItem(SubmissionOut):
    step_title: str
    step_type: str
    max_score: Decimal
    course_id: UUID
    course_title: str
    payload: dict


class SubmissionListOut(BaseModel):
    items: list[SubmissionListItem]
    total: int
    limit: int
    offset: int
