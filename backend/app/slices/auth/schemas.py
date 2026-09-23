from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas_common import ORMModel


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)
    full_name: str = Field(min_length=1, max_length=255)
    role: str = "student"


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    last_seen_at: datetime | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
