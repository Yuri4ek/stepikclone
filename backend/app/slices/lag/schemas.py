from pydantic import BaseModel


class LagListOut(BaseModel):
    items: list[dict]
    total: int
    limit: int
    offset: int
