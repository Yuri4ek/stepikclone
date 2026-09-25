from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.models.course import Course, CourseCurator, Step
from app.models.question import QuestionStatus, StepQuestion
from app.models.user import User, UserRole
from app.slices.learning.service import course_id_for_step
from app.slices.progress import service as progress_service
from app.slices.questions.schemas import QuestionListOut, QuestionOut


def _staff_courses(db: Session, user: User) -> list[uuid.UUID] | None:
    if user.role == UserRole.admin:
        return None
    if user.role != UserRole.curator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Curators only")
    return list(db.scalars(select(CourseCurator.course_id).where(CourseCurator.user_id == user.id)).all())


def _query():
    reviewer = aliased(User)
    student = aliased(User)
    return (
        select(StepQuestion, Step, Course, student, reviewer)
        .join(Step, Step.id == StepQuestion.step_id)
        .join(Course, Course.id == StepQuestion.course_id)
        .join(student, student.id == StepQuestion.user_id)
        .outerjoin(reviewer, reviewer.id == StepQuestion.answered_by)
    )


def _out(q: StepQuestion, step: Step, course: Course, student: User, reviewer: User | None) -> QuestionOut:
    return QuestionOut(
        id=q.id,
        step_id=step.id,
        step_title=step.title,
        course_id=course.id,
        course_title=course.title,
        student={"id": student.id, "full_name": student.full_name},
        text=q.text,
        status=q.status.value,
        answer=q.answer,
        answered_by={"id": reviewer.id, "full_name": reviewer.full_name} if reviewer else None,
        created_at=q.created_at,
        answered_at=q.answered_at,
    )


def _list(db: Session, q) -> QuestionListOut:
    rows = db.execute(q).all()
    items = [_out(*r) for r in rows]
    return QuestionListOut(items=items, total=len(items), open=sum(1 for i in items if i.status == "open"))


def ask(db: Session, user: User, step_id: uuid.UUID, text: str) -> QuestionOut:
    if user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    step = db.get(Step, step_id)
    if step is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    course_id = course_id_for_step(db, step)
    if progress_service.get_enrollment(db, user.id, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")
    question = StepQuestion(step_id=step.id, course_id=course_id, user_id=user.id, text=text.strip())
    db.add(question)
    db.commit()
    row = db.execute(_query().where(StepQuestion.id == question.id)).one()
    return _out(*row)


def for_step(db: Session, user: User, step_id: uuid.UUID) -> QuestionListOut:
    q = _query().where(StepQuestion.step_id == step_id).order_by(StepQuestion.created_at.asc())
    if user.role == UserRole.student:
        q = q.where(StepQuestion.user_id == user.id)
    else:
        allowed = _staff_courses(db, user)
        if allowed is not None:
            q = q.where(StepQuestion.course_id.in_(allowed))
    return _list(db, q)


def mine(db: Session, user: User) -> QuestionListOut:
    return _list(db, _query().where(StepQuestion.user_id == user.id).order_by(StepQuestion.created_at.desc()))


def inbox(db: Session, user: User, status_filter: str | None, course_id: uuid.UUID | None) -> QuestionListOut:
    allowed = _staff_courses(db, user)
    # Сначала открытые, среди них — кто ждёт дольше
    q = _query().order_by(StepQuestion.status.asc(), StepQuestion.created_at.asc())
    if allowed is not None:
        if not allowed:
            return QuestionListOut(items=[], total=0, open=0)
        q = q.where(StepQuestion.course_id.in_(allowed))
    if course_id:
        q = q.where(StepQuestion.course_id == course_id)
    if status_filter:
        try:
            q = q.where(StepQuestion.status == QuestionStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    return _list(db, q)


def answer(db: Session, user: User, question_id: uuid.UUID, text: str) -> QuestionOut:
    allowed = _staff_courses(db, user)
    question = db.get(StepQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    if allowed is not None and question.course_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")
    question.answer = text.strip()
    question.status = QuestionStatus.answered
    question.answered_by = user.id
    question.answered_at = datetime.now(UTC)
    db.commit()
    row = db.execute(_query().where(StepQuestion.id == question.id)).one()
    return _out(*row)
