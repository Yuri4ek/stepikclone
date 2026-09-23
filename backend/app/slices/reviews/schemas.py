from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class AcceptIn(BaseModel):
    score: Decimal
    feedback: str = ""


class ReturnIn(BaseModel):
    feedback: str = Field(min_length=1)


class ReviewActionOut(BaseModel):
    submission_id: UUID
    status: str
    step_status: str
    score: Decimal | None
    feedback: str | None


class QueueListOut(BaseModel):
    items: list[dict]
    total: int
    limit: int
    offset: int
