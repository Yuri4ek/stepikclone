import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.slices.lag import service
from app.slices.lag.schemas import LagListOut

router = APIRouter()
staff = require_roles(UserRole.curator, UserRole.admin)


@router.get("/students", response_model=LagListOut)
def lag_students(
    course_id: uuid.UUID | None = None,
    level: str | None = Query(None, pattern="^(ok|warning|critical)$"),
    include_ok: bool = Query(False, description="Вернуть всех учеников курсов куратора, а не только отстающих"),
    limit: int = Query(20, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> LagListOut:
    return service.list_lagging(db, user, course_id, level, limit, offset, include_ok)
