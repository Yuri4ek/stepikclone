from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, Lesson, Module, Step
from app.models.progress import (
    CourseProgress,
    Enrollment,
    EnrollmentStatus,
    StepProgress,
    StepProgressStatus,
)
from app.models.submission import CheckType, Submission, SubmissionStatus
from app.models.user import User
from app.steps import registry


PASSABLE = (StepProgressStatus.passed, StepProgressStatus.submitted, StepProgressStatus.returned)

TZ = ZoneInfo("Europe/Moscow")


def ordered_steps(db: Session, course_id: uuid.UUID) -> list[Step]:
    modules = db.scalars(
        select(Module)
        .where(Module.course_id == course_id)
        .options(joinedload(Module.lessons).joinedload(Lesson.steps))
        .order_by(Module.position)
    ).unique().all()

    steps: list[Step] = []
    for module in modules:
        for lesson in sorted(module.lessons, key=lambda x: x.position):
            for step in sorted(lesson.steps, key=lambda x: x.position):
                steps.append(step)
    return steps


def ensure_step_progress_rows(db: Session, user_id: uuid.UUID, course_id: uuid.UUID) -> list[Step]:
    steps = ordered_steps(db, course_id)
    existing = {
        sp.step_id: sp
        for sp in db.scalars(select(StepProgress).where(StepProgress.user_id == user_id)).all()
        if sp.step_id in {s.id for s in steps}
    }
    for index, step in enumerate(steps):
        if step.id in existing:
            continue
        status = StepProgressStatus.available if index == 0 else StepProgressStatus.locked
        db.add(StepProgress(user_id=user_id, step_id=step.id, status=status))
    db.flush()
    return steps


def unlock_next(db: Session, user_id: uuid.UUID, course_id: uuid.UUID) -> None:
    steps = ordered_steps(db, course_id)
    progress_map = {
        sp.step_id: sp
        for sp in db.scalars(
            select(StepProgress).where(
                StepProgress.user_id == user_id,
                StepProgress.step_id.in_([s.id for s in steps]),
            )
        ).all()
    }
    for step in steps:
        sp = progress_map.get(step.id)
        if sp is None:
            continue
        if sp.status == StepProgressStatus.locked:
            sp.status = StepProgressStatus.available
            db.add(sp)
            break
        if sp.status not in PASSABLE:
            break


def source_for_step(db: Session, user_id: uuid.UUID, step_id: uuid.UUID, kind: str) -> str:
    checker = registry.get(kind)
    if checker and checker.mode == "none":
        return "theory"
    sub = db.scalars(
        select(Submission)
        .where(
            Submission.user_id == user_id,
            Submission.step_id == step_id,
            Submission.status == SubmissionStatus.graded,
        )
        .order_by(Submission.reviewed_at.desc().nullslast(), Submission.created_at.desc())
    ).first()
    if sub is None:
        return "auto"
    return "manual" if sub.check_type == CheckType.manual else "auto"


def recalculate(db: Session, enrollment: Enrollment) -> CourseProgress:
    steps = ensure_step_progress_rows(db, enrollment.user_id, enrollment.course_id)
    required = [s for s in steps if s.is_required]
    progress_rows = {
        sp.step_id: sp
        for sp in db.scalars(
            select(StepProgress).where(
                StepProgress.user_id == enrollment.user_id,
                StepProgress.step_id.in_([s.id for s in steps]),
            )
        ).all()
    }

    completed = 0
    total_score = Decimal("0")
    total_max = Decimal("0")
    pending_max = Decimal("0")
    breakdown: list[dict] = []
    current_step_id: uuid.UUID | None = None
    first_returned: uuid.UUID | None = None

    for step in steps:
        sp = progress_rows.get(step.id)
        if sp is None:
            continue
        if current_step_id is None and sp.status not in PASSABLE:
            current_step_id = step.id
        if first_returned is None and sp.status == StepProgressStatus.returned:
            first_returned = step.id
        if not step.is_required:
            continue
        if sp.status == StepProgressStatus.passed:
            completed += 1
        if step.max_score and step.max_score > 0:
            total_max += Decimal(step.max_score)
            if sp.status == StepProgressStatus.submitted:
                pending_max += Decimal(step.max_score)
            score = Decimal(sp.best_score or sp.score or 0) if sp.status == StepProgressStatus.passed else Decimal("0")
            if sp.status == StepProgressStatus.passed:
                total_score += score
                breakdown.append(
                    {
                        "step_id": str(step.id),
                        "title": step.title,
                        "kind": step.kind,
                        "type": registry.step_type(step.kind, step.content),
                        "score": float(score),
                        "max_score": float(step.max_score),
                        "source": source_for_step(db, enrollment.user_id, step.id, step.kind),
                    }
                )

    current_step_id = current_step_id or first_returned

    percent = Decimal("0")
    if required:
        percent = (Decimal(completed) / Decimal(len(required)) * Decimal("100")).quantize(Decimal("0.01"))

    rating_score = Decimal("0")
    if total_max > 0:
        rating_score = (total_score / total_max * Decimal("100")).quantize(Decimal("0.01"))

    cp = enrollment.progress
    if cp is None:
        cp = CourseProgress(enrollment_id=enrollment.id)
        enrollment.progress = cp
        db.add(cp)

    cp.completed_steps = completed
    cp.total_required_steps = len(required)
    cp.percent = percent
    cp.current_step_id = current_step_id
    cp.rating_score = rating_score
    cp.rating_breakdown = {
        "steps": breakdown,
        "formula": "sum(score) / sum(max_score) * 100",
        "total_score": float(total_score),
        "total_max": float(total_max),
        "pending_max": float(pending_max),
        "percent": float(rating_score),
    }

    if required and completed >= len(required):
        enrollment.status = EnrollmentStatus.completed
    else:
        enrollment.status = EnrollmentStatus.active

    db.add(cp)
    db.add(enrollment)
    db.flush()
    return cp


def get_enrollment(db: Session, user_id: uuid.UUID, course_id: uuid.UUID) -> Enrollment | None:
    return db.scalars(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
    ).first()


def get_course_or_404(db: Session, course_id: uuid.UUID) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course



def _local_day(dt: datetime | None) -> date | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        from datetime import UTC

        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(TZ).date()


def activity_days(db: Session, user_id: uuid.UUID, step_ids: list[uuid.UUID] | None = None) -> set[date]:
    """Дни, когда ученик что-то сдал или прошёл шаг (просто вход не считается)."""
    subs = select(Submission.created_at).where(Submission.user_id == user_id)
    done = select(StepProgress.completed_at).where(
        StepProgress.user_id == user_id, StepProgress.completed_at.is_not(None)
    )
    if step_ids is not None:
        subs = subs.where(Submission.step_id.in_(step_ids))
        done = done.where(StepProgress.step_id.in_(step_ids))
    days = {_local_day(x) for x in db.scalars(subs).all()} | {_local_day(x) for x in db.scalars(done).all()}
    days.discard(None)
    return days  # type: ignore[return-value]


def streak(days: set[date], today: date | None = None) -> int:
    """Сколько дней подряд ученик занимается. Серия не рвётся, пока не закончился следующий день."""
    today = today or datetime.now(TZ).date()
    cursor = today if today in days else today - timedelta(days=1)
    count = 0
    while cursor in days:
        count += 1
        cursor -= timedelta(days=1)
    return count


def short_name(full_name: str) -> str:
    parts = full_name.split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    return full_name


def leaderboard(db: Session, course_id: uuid.UUID, user_id: uuid.UUID, top: int = 10) -> dict:
    """Место в группе курса: по рейтингу, при равенстве — по доле пройденных шагов."""
    rows = db.execute(
        select(Enrollment, CourseProgress, User)
        .join(User, User.id == Enrollment.user_id)
        .outerjoin(CourseProgress, CourseProgress.enrollment_id == Enrollment.id)
        .where(Enrollment.course_id == course_id)
    ).all()
    ranked = sorted(
        rows,
        key=lambda r: (
            -(float(r[1].rating_score) if r[1] else 0.0),
            -(float(r[1].percent) if r[1] else 0.0),
            r[2].full_name,
        ),
    )
    items = []
    place = None
    prev_key = None
    prev_place = 0
    for i, (_enr, cp, user) in enumerate(ranked, start=1):
        key = (float(cp.rating_score) if cp else 0.0, float(cp.percent) if cp else 0.0)
        cur_place = prev_place if key == prev_key else i
        prev_key, prev_place = key, cur_place
        me = user.id == user_id
        if me:
            place = cur_place
        if i <= top or me:
            items.append(
                {
                    "place": cur_place,
                    "name": user.full_name if me else short_name(user.full_name),
                    "rating": key[0],
                    "percent": key[1],
                    "me": me,
                }
            )
    return {"place": place, "group_size": len(ranked), "items": items}
