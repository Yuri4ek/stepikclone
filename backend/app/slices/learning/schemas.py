from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SubmitIn(BaseModel):
    answers: dict = Field(default_factory=dict)


class StepDetailOut(BaseModel):
    id: UUID
    title: str
    kind: str
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
    progress_percent: Decimal


class CompleteOut(BaseModel):
    step_id: UUID
    status: str
    progress_percent: Decimal
    rating: dict


class SubmissionOut(BaseModel):
    id: UUID
    step_id: UUID
    check_type: str
    status: str
    score: Decimal | None
    feedback: str | None
    created_at: str | None
    reviewed_at: str | None
