import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.uploads import SUBMISSIONS_DIR, save_image
from app.models.user import User, UserRole
from app.slices.learning import service
from app.slices.learning.schemas import (
    CompleteOut,
    StepDetailOut,
    SubmissionListOut,
    SubmissionOut,
    SubmitIn,
    SubmitOut,
)

router = APIRouter()
student_dep = require_roles(UserRole.student)


@router.get("/steps/{step_id}", response_model=StepDetailOut)
def get_step(
    step_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StepDetailOut:
    return service.get_step(db, user, step_id)


@router.post("/steps/{step_id}/complete", response_model=CompleteOut)
def complete_step(
    step_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CompleteOut:
    return service.complete_theory(db, user, step_id)


@router.post("/steps/{step_id}/submit", response_model=SubmitOut)
def submit_step(
    step_id: uuid.UUID,
    body: SubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SubmitOut:
    return service.submit(db, user, step_id, body)


@router.get("/submissions", response_model=SubmissionListOut)
def list_submissions(
    course_id: uuid.UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(student_dep),
) -> SubmissionListOut:
    return service.list_submissions(db, user, course_id, status_filter, limit, offset)


@router.get("/submissions/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SubmissionOut:
    return service.get_submission(db, user, submission_id)


@router.post("/uploads", status_code=201)
async def upload_attachment(
    file: UploadFile = File(...),
    _: User = Depends(student_dep),
) -> dict:
    """Скриншот к работе (Minecraft, проект). Возвращает URL, который ученик кладёт в ответ."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    return {"url": await save_image(file, SUBMISSIONS_DIR)}
