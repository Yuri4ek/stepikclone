import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.slices.questions import service
from app.slices.questions.schemas import AnswerIn, AskIn, QuestionListOut, QuestionOut

router = APIRouter()
staff = require_roles(UserRole.curator, UserRole.admin)
student = require_roles(UserRole.student)


@router.post("/steps/{step_id}", response_model=QuestionOut, status_code=201)
def ask(step_id: uuid.UUID, body: AskIn, db: Session = Depends(get_db), user: User = Depends(student)) -> QuestionOut:
    """Ученик задаёт вопрос куратору по конкретному шагу."""
    return service.ask(db, user, step_id, body.text)


@router.get("/steps/{step_id}", response_model=QuestionListOut)
def for_step(step_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> QuestionListOut:
    return service.for_step(db, user, step_id)


@router.get("/mine", response_model=QuestionListOut)
def mine(db: Session = Depends(get_db), user: User = Depends(student)) -> QuestionListOut:
    return service.mine(db, user)


@router.get("/inbox", response_model=QuestionListOut)
def inbox(
    status_filter: str | None = Query(None, alias="status"),
    course_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(staff),
) -> QuestionListOut:
    """Вопросы учеников курсов куратора: сначала открытые, дольше всего ждущие — выше."""
    return service.inbox(db, user, status_filter, course_id)


@router.post("/{question_id}/answer", response_model=QuestionOut)
def answer(question_id: uuid.UUID, body: AnswerIn, db: Session = Depends(get_db), user: User = Depends(staff)) -> QuestionOut:
    return service.answer(db, user, question_id, body.text)
