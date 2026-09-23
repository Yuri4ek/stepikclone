import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.slices.reviews import service
from app.slices.reviews.schemas import AcceptIn, QueueListOut, ReturnIn, ReviewActionOut

router = APIRouter()
staff = require_roles(UserRole.curator, UserRole.admin)


@router.get("/queue", response_model=QueueListOut)
def queue(
    course_id: uuid.UUID | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> QueueListOut:
    return service.list_queue(db, user, course_id, limit, offset)


@router.get("/submissions/{submission_id}")
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> dict:
    return service.get_submission(db, user, submission_id)


@router.post("/submissions/{submission_id}/accept", response_model=ReviewActionOut)
def accept(
    submission_id: uuid.UUID,
    body: AcceptIn,
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> ReviewActionOut:
    return service.accept(db, user, submission_id, body)


@router.post("/submissions/{submission_id}/return", response_model=ReviewActionOut)
def return_work(
    submission_id: uuid.UUID,
    body: ReturnIn,
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> ReviewActionOut:
    return service.return_submission(db, user, submission_id, body)
