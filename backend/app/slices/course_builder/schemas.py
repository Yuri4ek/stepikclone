from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=120)
    description: str = ""
    cover_url: str | None = None
    passport: dict = Field(default_factory=dict)


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_url: str | None = None
    passport: dict | None = None


class CourseOut(BaseModel):
    id: UUID
    slug: str
    title: str
    description: str
    cover_url: str | None = None
    passport: dict = Field(default_factory=dict)
    status: str


class ModuleCreate(BaseModel):
    title: str
    position: int = 1


class ModuleUpdate(BaseModel):
    title: str | None = None
    position: int | None = None


class ModuleOut(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    position: int


class LessonCreate(BaseModel):
    title: str
    position: int = 1


class LessonUpdate(BaseModel):
    title: str | None = None
    position: int | None = None


class LessonOut(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    position: int


class StepCreate(BaseModel):
    title: str
    position: int = 1
    kind: str
    max_score: Decimal = Decimal("0")
    is_required: bool = True
    content: dict = Field(default_factory=dict)


class StepUpdate(BaseModel):
    title: str | None = None
    kind: str | None = None
    position: int | None = None
    content: dict | None = None
    max_score: Decimal | None = None
    is_required: bool | None = None


class StepOut(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    position: int
    kind: str
    max_score: Decimal
    is_required: bool
    content: dict


class CuratorAssign(BaseModel):
    user_id: UUID


class StudentAssign(BaseModel):
    user_id: UUID


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role: str
    password: str = Field(min_length=6)
