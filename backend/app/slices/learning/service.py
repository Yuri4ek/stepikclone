from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Step, StepKind
from app.models.progress import StepProgress, StepProgressStatus
from app.models.submission import CheckType, Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.slices.learning.schemas import CompleteOut, StepDetailOut, SubmissionOut, SubmitIn, SubmitOut
from app.slices.progress import service as progress_service


def _course_id_for_step(db: Session, step: Step) -> uuid.UUID:
    from app.models.course import Lesson, Module

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
    course_id = _course_id_for_step(db, step)
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


def _public_content(step: Step) -> dict:
    content = dict(step.content or {})
    if step.kind == StepKind.quiz:
        content.pop("correct_option_id", None)
    return content


def _latest_feedback(db: Session, user_id: uuid.UUID, step_id: uuid.UUID) -> str | None:
    sub = db.scalars(
        select(Submission)
        .where(Submission.user_id == user_id, Submission.step_id == step_id)
        .order_by(Submission.created_at.desc())
    ).first()
    return sub.feedback if sub else None


def get_step(db: Session, user: User, step_id: uuid.UUID) -> StepDetailOut:
    step, sp, _ = _get_student_step(db, user, step_id)
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")
    db.commit()
    return StepDetailOut(
        id=step.id,
        title=step.title,
        kind=step.kind.value,
        max_score=step.max_score,
        content=_public_content(step),
        progress={
            "status": sp.status.value,
            "score": float(sp.score) if sp.score is not None else None,
            "feedback": _latest_feedback(db, user.id, step.id),
        },
    )


def grade_quiz(step: Step, answers: dict) -> tuple[Decimal, str, StepProgressStatus]:
    correct = (step.content or {}).get("correct_option_id")
    selected = answers.get("selected_option_id")
    if selected == correct:
        return Decimal(step.max_score), "Верно", StepProgressStatus.passed
    return Decimal("0"), "Неверно", StepProgressStatus.failed


def complete_theory(db: Session, user: User, step_id: uuid.UUID) -> CompleteOut:
    step, sp, course_id = _get_student_step(db, user, step_id)
    if step.kind != StepKind.theory:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only theory steps")
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")

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
    )


def submit(db: Session, user: User, step_id: uuid.UUID, data: SubmitIn) -> SubmitOut:
    step, sp, course_id = _get_student_step(db, user, step_id)
    if step.kind == StepKind.theory:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use complete for theory")
    if sp.status == StepProgressStatus.locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step is locked")
    if sp.status == StepProgressStatus.submitted:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already submitted, wait for review")

    sp.attempts_count += 1

    if step.kind == StepKind.quiz:
        score, feedback, step_status = grade_quiz(step, data.answers)
        submission = Submission(
            user_id=user.id,
            step_id=step.id,
            payload=data.answers,
            check_type=CheckType.auto,
            status=SubmissionStatus.graded,
            score=score,
            feedback=feedback,
            reviewed_at=datetime.now(UTC),
        )
        sp.status = step_status
        sp.score = score
        if sp.best_score is None or score > sp.best_score:
            sp.best_score = score
        if step_status == StepProgressStatus.passed:
            sp.completed_at = datetime.now(UTC)
            progress_service.unlock_next(db, user.id, course_id)
        elif step_status == StepProgressStatus.failed:
            # квиз можно пересдать
            sp.status = StepProgressStatus.available
        db.add(submission)
        db.add(sp)
        enrollment = progress_service.get_enrollment(db, user.id, course_id)
        assert enrollment is not None
        cp = progress_service.recalculate(db, enrollment)
        db.commit()
        db.refresh(submission)
        return SubmitOut(
            submission_id=submission.id,
            check_type="auto",
            status=submission.status.value,
            step_status=sp.status.value if step_status != StepProgressStatus.failed else StepProgressStatus.failed.value,
            score=score,
            max_score=step.max_score,
            feedback=feedback,
            progress_percent=cp.percent,
        )

    # task / code → ручная (code пока тоже в очередь куратора, без sandbox)
    check = CheckType.manual
    submission = Submission(
        user_id=user.id,
        step_id=step.id,
        payload=data.answers,
        check_type=check,
        status=SubmissionStatus.pending,
    )
    sp.status = StepProgressStatus.submitted
    db.add(submission)
    db.add(sp)
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    assert enrollment is not None
    cp = progress_service.recalculate(db, enrollment)
    db.commit()
    db.refresh(submission)
    return SubmitOut(
        submission_id=submission.id,
        check_type=check.value,
        status=submission.status.value,
        step_status=sp.status.value,
        score=None,
        max_score=step.max_score,
        feedback=None,
        progress_percent=cp.percent,
    )


def get_submission(db: Session, user: User, submission_id: uuid.UUID) -> SubmissionOut:
    sub = db.get(Submission, submission_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return SubmissionOut(
        id=sub.id,
        step_id=sub.step_id,
        check_type=sub.check_type.value,
        status=sub.status.value,
        score=sub.score,
        feedback=sub.feedback,
        created_at=sub.created_at.isoformat() if sub.created_at else None,
        reviewed_at=sub.reviewed_at.isoformat() if sub.reviewed_at else None,
    )
