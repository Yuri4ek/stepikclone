from pydantic import BaseModel, ConfigDict, EmailStr


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserPublic(ORMModel):
    id: str
    email: EmailStr
    full_name: str
    role: str


class PageMeta(BaseModel):
    total: int
    limit: int
    offset: int
