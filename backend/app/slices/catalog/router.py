import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.slices.catalog import service
from app.slices.catalog.schemas import CatalogListOut, EnrollmentOut, NextStepOut, OutlineOut

router = APIRouter()


@router.get("/courses", response_model=CatalogListOut)
def list_courses(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CatalogListOut:
    return service.list_courses(db, user, limit, offset)


@router.post("/courses/{course_id}/enroll", response_model=EnrollmentOut, status_code=201)
def enroll(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EnrollmentOut:
    return service.enroll(db, user, course_id)


@router.get("/courses/{course_id}/outline", response_model=OutlineOut)
def outline(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OutlineOut:
    return service.outline(db, user, course_id)


@router.get("/courses/{course_id}/next", response_model=NextStepOut)
def next_step(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NextStepOut:
    return service.next_step(db, user, course_id)
