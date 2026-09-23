import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.slices.learning import service
from app.slices.learning.schemas import CompleteOut, StepDetailOut, SubmissionOut, SubmitIn, SubmitOut

router = APIRouter()


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


@router.get("/submissions/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SubmissionOut:
    return service.get_submission(db, user, submission_id)
