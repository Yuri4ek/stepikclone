from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseCurator, Lesson, Module, Step
from app.models.progress import StepProgress, StepProgressStatus
from app.models.submission import CheckType, Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.slices.progress import service as progress_service
from app.slices.reviews.schemas import AcceptIn, QueueListOut, ReturnIn, ReviewActionOut
from app.steps import registry


def _curator_course_ids(db: Session, user: User) -> list[uuid.UUID] | None:
    if user.role == UserRole.admin:
        return None
    if user.role != UserRole.curator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Curators only")
    return list(db.scalars(select(CourseCurator.course_id).where(CourseCurator.user_id == user.id)).all())


def _course_id_for_step(db: Session, step: Step) -> uuid.UUID:
    lesson = db.get(Lesson, step.lesson_id)
    module = db.get(Module, lesson.module_id) if lesson else None
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found for step")
    return module.course_id


def list_queue(
    db: Session, user: User, course_id: uuid.UUID | None, limit: int, offset: int
) -> QueueListOut:
    allowed = _curator_course_ids(db, user)
    q = (
        select(Submission, Step, User, Course)
        .join(Step, Step.id == Submission.step_id)
        .join(User, User.id == Submission.user_id)
        .join(Lesson, Lesson.id == Step.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .join(Course, Course.id == Module.course_id)
        .where(
            Submission.status == SubmissionStatus.pending,
            Submission.check_type == CheckType.manual,
        )
        .order_by(Submission.created_at.asc())
    )
    if course_id:
        q = q.where(Course.id == course_id)
    if allowed is not None:
        if not allowed:
            return QueueListOut(items=[], total=0, limit=limit, offset=offset)
        q = q.where(Course.id.in_(allowed))

    rows = db.execute(q).all()
    total = len(rows)
    page = rows[offset : offset + limit]
    items = []
    for sub, step, student, course in page:
        payload = sub.payload if isinstance(sub.payload, dict) else {}
        text = str(payload.get("text") or payload.get("link") or "")[:200]
        items.append(
            {
                "submission_id": sub.id,
                "course_id": course.id,
                "course_title": course.title,
                "step_id": step.id,
                "step_title": step.title,
                "step_type": registry.step_type(step.kind, step.content),
                "has_screenshot": bool(payload.get("screenshot_url")),
                "student": {"id": student.id, "full_name": student.full_name, "email": student.email},
                "submitted_at": sub.created_at.isoformat() if sub.created_at else None,
                "preview": text,
            }
        )
    return QueueListOut(items=items, total=total, limit=limit, offset=offset)


def get_submission(db: Session, user: User, submission_id: uuid.UUID) -> dict:
    allowed = _curator_course_ids(db, user)
    sub = db.get(Submission, submission_id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    step = db.get(Step, sub.step_id)
    if step is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    course_id = _course_id_for_step(db, step)
    if allowed is not None and course_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")
    student = db.get(User, sub.user_id)
    return {
        "id": sub.id,
        "status": sub.status.value,
        "payload": sub.payload,
        "step": {
            "id": step.id,
            "title": step.title,
            "kind": step.kind,
            "type": registry.step_type(step.kind, step.content),
            "max_score": step.max_score,
            "content": step.content,
        },
        "course_id": course_id,
        "attempt": _attempt_number(db, sub),
        "student": {"id": student.id, "full_name": student.full_name} if student else None,
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
    }


def _attempt_number(db: Session, sub: Submission) -> int:
    earlier = db.scalars(
        select(Submission.id).where(
            Submission.user_id == sub.user_id,
            Submission.step_id == sub.step_id,
            Submission.created_at <= sub.created_at,
        )
    ).all()
    return len(earlier)


def accept(db: Session, user: User, submission_id: uuid.UUID, data: AcceptIn) -> ReviewActionOut:
    get_submission(db, user, submission_id)
    sub = db.get(Submission, submission_id)
    step = db.get(Step, sub.step_id)
    assert sub is not None and step is not None
    if sub.status != SubmissionStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already reviewed")
    if data.score < 0 or data.score > step.max_score:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Score out of range")

    sub.status = SubmissionStatus.graded
    sub.score = data.score
    sub.feedback = data.feedback
    sub.reviewed_by = user.id
    sub.reviewed_at = datetime.now(UTC)

    sp = db.scalars(
        select(StepProgress).where(StepProgress.user_id == sub.user_id, StepProgress.step_id == sub.step_id)
    ).first()
    if sp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step progress missing")
    sp.status = StepProgressStatus.passed
    sp.score = data.score
    if sp.best_score is None or data.score > sp.best_score:
        sp.best_score = data.score
    sp.completed_at = datetime.now(UTC)

    course_id = _course_id_for_step(db, step)
    progress_service.unlock_next(db, sub.user_id, course_id)
    enrollment = progress_service.get_enrollment(db, sub.user_id, course_id)
    if enrollment:
        progress_service.recalculate(db, enrollment)

    db.add(sub)
    db.add(sp)
    db.commit()
    return ReviewActionOut(
        submission_id=sub.id,
        status=sub.status.value,
        step_status=sp.status.value,
        score=sub.score,
        feedback=sub.feedback,
    )


def return_submission(db: Session, user: User, submission_id: uuid.UUID, data: ReturnIn) -> ReviewActionOut:
    get_submission(db, user, submission_id)
    sub = db.get(Submission, submission_id)
    assert sub is not None
    if sub.status != SubmissionStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already reviewed")

    sub.status = SubmissionStatus.returned
    sub.feedback = data.feedback
    sub.score = None
    sub.reviewed_by = user.id
    sub.reviewed_at = datetime.now(UTC)

    sp = db.scalars(
        select(StepProgress).where(StepProgress.user_id == sub.user_id, StepProgress.step_id == sub.step_id)
    ).first()
    if sp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step progress missing")
    sp.status = StepProgressStatus.returned

    step = db.get(Step, sub.step_id)
    assert step is not None
    course_id = _course_id_for_step(db, step)
    enrollment = progress_service.get_enrollment(db, sub.user_id, course_id)
    if enrollment:
        progress_service.recalculate(db, enrollment)

    db.add(sub)
    db.add(sp)
    db.commit()
    return ReviewActionOut(
        submission_id=sub.id,
        status=sub.status.value,
        step_status=sp.status.value,
        score=None,
        feedback=sub.feedback,
    )
