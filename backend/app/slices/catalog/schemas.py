from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class EnrollmentBrief(BaseModel):
    id: UUID
    status: str
    percent: Decimal
    rating_score: Decimal


class CatalogCourseItem(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    cover_url: str | None = None
    passport: dict = {}
    steps_total: int = 0
    status: str
    enrollment: EnrollmentBrief | None


class CatalogListOut(BaseModel):
    items: list[CatalogCourseItem]
    total: int
    limit: int
    offset: int


class EnrollmentOut(BaseModel):
    id: UUID
    course_id: UUID
    status: str
    enrolled_at: str


class StepProgressBrief(BaseModel):
    status: str
    score: Decimal | None
    best_score: Decimal | None


class OutlineStep(BaseModel):
    id: UUID
    title: str
    position: int
    kind: str
    type: str
    max_score: Decimal
    is_required: bool
    progress: StepProgressBrief


class OutlineLesson(BaseModel):
    id: UUID
    title: str
    position: int
    steps: list[OutlineStep]


class OutlineModule(BaseModel):
    id: UUID
    title: str
    position: int
    lessons: list[OutlineLesson]


class OutlineOut(BaseModel):
    course: dict
    modules: list[OutlineModule]


class NextStepOut(BaseModel):
    course_id: UUID
    percent: Decimal
    current_step: dict | None
    message: str
