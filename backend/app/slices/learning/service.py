from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.course import Course, Lesson, Module, Step
from app.models.progress import StepProgress, StepProgressStatus
from app.models.submission import CheckType, Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.slices.learning.schemas import (
    CompleteOut,
    StepDetailOut,
    SubmissionListItem,
    SubmissionListOut,
    SubmissionOut,
    SubmitIn,
    SubmitOut,
)
from app.slices.progress import service as progress_service
from app.steps import registry


def course_id_for_step(db: Session, step: Step) -> uuid.UUID:
    lesson = db.get(Lesson, step.lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    module = db.get(Module, lesson.module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module.course_id


def _get_student_step(db: Session, user: User, step_id: uuid.UUID) -> tuple[Step, StepProgress, uuid.UUID]:
    if user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    step = db.get(Step, step_id)
    if step is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    course_id = course_id_for_step(db, step)
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")
    progress_service.ensure_step_progress_rows(db, user.id, course_id)
    sp = db.scalars(
        select(StepProgress).where(StepProgress.user_id == user.id, StepProgress.step_id == step_id)
    ).first()
    if sp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found")
    return step, sp, course_id


def _checker(step: Step) -> registry.Checker:
    checker = registry.get(step.kind)
    if checker is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown step kind: {step.kind}")
    return checker


def _latest_submission(db: Session, user_id: uuid.UUID, step_id: uuid.UUID) -> Submission | None:
    return db.scalars(
        select(Submission)
        .where(Submission.user_id == user_id, Submission.step_id == step_id)
        .order_by(Submission.created_at.desc())
    ).first()


def _next_open_step(db: Session, user_id: uuid.UUID, course_id: uuid.UUID, after: Step) -> uuid.UUID | None:
    steps = progress_service.ordered_steps(db, course_id)
    ids = [s.id for s in steps]
    if after.id not in ids:
        return None
    nxt = steps[ids.index(after.id) + 1] if ids.index(after.id) + 1 < len(steps) else None
    if nxt is None:
        return None
    sp = db.scalars(select(StepProgress).where(StepProgress.user_id == user_id, StepProgress.step_id == nxt.id)).first()
    return nxt.id if sp and sp.status != StepProgressStatus.locked else None


def get_step(db: Session, user: User, step_id: uuid.UUID) -> StepDetailOut:
    step, sp, _ = _get_student_step(db, user, step_id)
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")
    db.commit()
    last = _latest_submission(db, user.id, step.id)
    return StepDetailOut(
        id=step.id,
        title=step.title,
        kind=step.kind,
        type=registry.step_type(step.kind, step.content),
        max_score=step.max_score,
        content=registry.public_content(step.kind, step.content),
        progress={
            "status": sp.status.value,
            "score": float(sp.score) if sp.score is not None else None,
            "best_score": float(sp.best_score) if sp.best_score is not None else None,
            "attempts": sp.attempts_count,
            "feedback": last.feedback if last else None,
            # Своя последняя отправка вместе с ответом: ученик продолжает с того, что отправил
            "last_submission": {**_submission_out(last).model_dump(mode="json"), "payload": last.payload or {}} if last else None,
        },
    )


def complete_theory(db: Session, user: User, step_id: uuid.UUID) -> CompleteOut:
    step, sp, course_id = _get_student_step(db, user, step_id)
    if _checker(step).mode != "none":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only theory steps")
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")

    if sp.status != StepProgressStatus.passed:
        sp.status = StepProgressStatus.passed
        sp.completed_at = datetime.now(UTC)
        sp.attempts_count += 1
        db.add(sp)
    progress_service.unlock_next(db, user.id, course_id)
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    assert enrollment is not None
    cp = progress_service.recalculate(db, enrollment)
    db.commit()
    return CompleteOut(
        step_id=step.id,
        status=sp.status.value,
        progress_percent=cp.percent,
        rating={"score": float(cp.rating_score), "breakdown_ref": f"/api/v1/progress/courses/{course_id}"},
        next_step_id=_next_open_step(db, user.id, course_id, step),
    )


def submit(db: Session, user: User, step_id: uuid.UUID, data: SubmitIn) -> SubmitOut:
    step, sp, course_id = _get_student_step(db, user, step_id)
    checker = _checker(step)
    if checker.mode == "none":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use complete for theory")
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")
    if sp.status == StepProgressStatus.submitted:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Работа уже на проверке, дождись ответа куратора")
    if checker.mode == "manual" and sp.status == StepProgressStatus.passed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Работа уже зачтена")
    if checker.validate_answers:
        problem = checker.validate_answers(data.answers)
        if problem:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=problem)

    sp.attempts_count += 1
    now = datetime.now(UTC)

    if checker.mode == "auto" and checker.grade:
        result = checker.grade(step.content or {}, data.answers, Decimal(step.max_score))
        submission = Submission(
            user_id=user.id,
            step_id=step.id,
            payload=data.answers,
            check_type=CheckType.auto,
            status=SubmissionStatus.graded,
            score=result.score,
            feedback=result.feedback,
            result=result.details,
            reviewed_at=now,
        )
        if result.passed:
            sp.status = StepProgressStatus.passed
            sp.score = result.score
            sp.completed_at = sp.completed_at or now
            if sp.best_score is None or result.score > sp.best_score:
                sp.best_score = result.score
        elif sp.status != StepProgressStatus.passed:
            # Неудачная попытка не отнимает уже зачтённый шаг; иначе — «Не прошло», можно отправить снова
            sp.status = StepProgressStatus.failed
            sp.score = result.score
        step_status = StepProgressStatus.passed if result.passed else StepProgressStatus.failed
    else:
        submission = Submission(
            user_id=user.id,
            step_id=step.id,
            payload=data.answers,
            check_type=CheckType.manual,
            status=SubmissionStatus.pending,
        )
        sp.status = StepProgressStatus.submitted
        step_status = sp.status

    db.add(submission)
    db.add(sp)
    progress_service.unlock_next(db, user.id, course_id)
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    assert enrollment is not None
    cp = progress_service.recalculate(db, enrollment)
    db.commit()
    db.refresh(submission)
    return SubmitOut(
        submission_id=submission.id,
        check_type=submission.check_type.value,
        status=submission.status.value,
        step_status=step_status.value,
        score=submission.score,
        max_score=step.max_score,
        feedback=submission.feedback,
        result=submission.result,
        progress_percent=cp.percent,
        next_step_id=_next_open_step(db, user.id, course_id, step),
    )


def _submission_out(sub: Submission) -> SubmissionOut:
    return SubmissionOut(
        id=sub.id,
        step_id=sub.step_id,
        check_type=sub.check_type.value,
        status=sub.status.value,
        score=sub.score,
        feedback=sub.feedback,
        result=sub.result,
        created_at=sub.created_at.isoformat() if sub.created_at else None,
        reviewed_at=sub.reviewed_at.isoformat() if sub.reviewed_at else None,
    )


def get_submission(db: Session, user: User, submission_id: uuid.UUID) -> SubmissionOut:
    sub = db.get(Submission, submission_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return _submission_out(sub)


def list_submissions(
    db: Session,
    user: User,
    course_id: uuid.UUID | None,
    status_filter: str | None,
    limit: int,
    offset: int,
) -> SubmissionListOut:
    """История работ ученика со статусами и комментариями — с сервера, видна с любого устройства."""
    q = (
        select(Submission, Step, Course)
        .join(Step, Step.id == Submission.step_id)
        .join(Lesson, Lesson.id == Step.lesson_id)
        .join(Module, Module.id == Lesson.module_id)
        .join(Course, Course.id == Module.course_id)
        .where(Submission.user_id == user.id)
    )
    if course_id:
        q = q.where(Course.id == course_id)
    if status_filter:
        try:
            q = q.where(Submission.status == SubmissionStatus(status_filter))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    rows = db.execute(q.order_by(Submission.created_at.desc()).limit(limit).offset(offset)).all()
    items = [
        SubmissionListItem(
            **_submission_out(sub).model_dump(),
            step_title=step.title,
            step_type=registry.step_type(step.kind, step.content),
            max_score=step.max_score,
            course_id=course.id,
            course_title=course.title,
            payload=sub.payload or {},
        )
        for sub, step, course in rows
    ]
    return SubmissionListOut(items=items, total=total, limit=limit, offset=offset)
