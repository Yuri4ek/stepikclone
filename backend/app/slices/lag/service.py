"""Отставание учеников: куратор должен увидеть проблему раньше, чем ученик перестанет заходить.

Кроме «давно не заходил» считаем ранние сигналы: заходит, но не продвигается; застрял на шаге
(несколько неудачных попыток подряд); не исправляет возвращённую работу; заметно отстаёт от группы.
"""

from __future__ import annotations

import statistics
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseCurator, Step
from app.models.progress import CourseProgress, Enrollment, StepProgress, StepProgressStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.slices.lag.schemas import LagListOut
from app.slices.progress import service as progress_service

WARNING_DAYS = 3  # без входа
CRITICAL_DAYS = 7
STALL_DAYS = 4  # заходит, но ничего не сдаёт и не проходит
STALL_CRITICAL_DAYS = 10
STUCK_ATTEMPTS = 3  # неудачных попыток на текущем шаге
RETURNED_IDLE_DAYS = 2  # возвращённая работа не исправлена
BEHIND_GAP = 30  # п. п. ниже медианы группы
MIN_GROUP = 3

_ORDER = {"ok": 0, "warning": 1, "critical": 2}


def _allowed_courses(db: Session, user: User) -> list[uuid.UUID] | None:
    if user.role == UserRole.admin:
        return None
    if user.role != UserRole.curator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Curators only")
    return list(db.scalars(select(CourseCurator.course_id).where(CourseCurator.user_id == user.id)).all())


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _plural(n: int, one: str, few: str, many: str) -> str:
    m10, m100 = n % 10, n % 100
    if m10 == 1 and m100 != 11:
        return f"{n} {one}"
    if 2 <= m10 <= 4 and not 12 <= m100 <= 14:
        return f"{n} {few}"
    return f"{n} {many}"


def _days(n: int) -> str:
    return _plural(n, "день", "дня", "дней")


def _analyze(
    db: Session,
    enrollment: Enrollment,
    student: User,
    cp: CourseProgress,
    steps: list[Step],
    median: float | None,
    now: datetime,
) -> dict:
    step_ids = [s.id for s in steps]
    titles = {s.id: s.title for s in steps}
    percent = float(cp.percent)

    last_seen = _aware(student.last_seen_at) or _aware(enrollment.enrolled_at)
    days_login = (now - last_seen).days if last_seen else 0

    last_done = db.scalar(
        select(func.max(StepProgress.completed_at)).where(
            StepProgress.user_id == student.id, StepProgress.step_id.in_(step_ids)
        )
    )
    last_sub = db.scalar(
        select(func.max(Submission.created_at)).where(Submission.user_id == student.id, Submission.step_id.in_(step_ids))
    )
    candidates = [d for d in (_aware(last_done), _aware(last_sub), _aware(enrollment.enrolled_at)) if d]
    last_progress = max(candidates) if candidates else None
    days_progress = (now - last_progress).days if last_progress else 0

    signals: list[dict] = []
    if percent < 100:
        if days_login >= CRITICAL_DAYS:
            signals.append({"code": "inactive", "level": "critical", "text": f"{_days(days_login)} без входа"})
        elif days_login >= WARNING_DAYS:
            signals.append({"code": "inactive", "level": "warning", "text": f"{_days(days_login)} без входа"})
        elif days_progress >= STALL_DAYS:
            # Ранний сигнал: ученик ещё заходит, но перестал продвигаться
            level = "critical" if days_progress >= STALL_CRITICAL_DAYS else "warning"
            signals.append(
                {"code": "stalled", "level": level, "text": f"Заходит, но {_days(days_progress)} без продвижения"}
            )

        if cp.current_step_id:
            sp = db.scalars(
                select(StepProgress).where(
                    StepProgress.user_id == student.id, StepProgress.step_id == cp.current_step_id
                )
            ).first()
            if sp and sp.status == StepProgressStatus.failed and sp.attempts_count >= STUCK_ATTEMPTS:
                signals.append(
                    {
                        "code": "stuck",
                        "level": "warning",
                        "text": f"{_plural(sp.attempts_count, 'неудачная попытка', 'неудачные попытки', 'неудачных попыток')}"
                        f" на шаге «{titles.get(sp.step_id, '')}»",
                    }
                )

        returned = db.execute(
            select(StepProgress.step_id, func.max(Submission.reviewed_at))
            .join(
                Submission,
                (Submission.step_id == StepProgress.step_id) & (Submission.user_id == StepProgress.user_id),
            )
            .where(
                StepProgress.user_id == student.id,
                StepProgress.step_id.in_(step_ids),
                StepProgress.status == StepProgressStatus.returned,
                Submission.status == SubmissionStatus.returned,
            )
            .group_by(StepProgress.step_id)
        ).all()
        for step_id, reviewed_at in returned:
            idle = (now - _aware(reviewed_at)).days if reviewed_at else 0
            if idle >= RETURNED_IDLE_DAYS:
                signals.append(
                    {
                        "code": "returned_idle",
                        "level": "warning",
                        "text": f"Не исправляет возвращённую работу «{titles.get(step_id, '')}» {_days(idle)}",
                    }
                )

        if median is not None and median - percent >= BEHIND_GAP:
            signals.append(
                {
                    "code": "behind",
                    "level": "warning",
                    "text": f"Отстаёт от группы: {round(percent)} % при медиане {round(median)} %",
                }
            )

    level = max((s["level"] for s in signals), key=_ORDER.__getitem__, default="ok")
    # Несколько тревожных сигналов сразу — повод написать первым делом
    if level == "warning" and sum(1 for s in signals if s["level"] == "warning") >= 3:
        level = "critical"

    step_title = titles.get(cp.current_step_id) if cp.current_step_id else None
    return {
        "enrollment_id": enrollment.id,
        "student": {"id": student.id, "full_name": student.full_name, "email": student.email},
        "percent": percent,
        "rating": float(cp.rating_score),
        "days_since_activity": days_login,
        "days_since_progress": days_progress,
        "lag_level": level,
        "current_step_title": step_title,
        "last_seen_at": last_seen.isoformat() if last_seen else None,
        "last_progress_at": last_progress.isoformat() if last_progress else None,
        "signals": signals,
        "reason": signals[0]["text"] if signals else ("Курс пройден" if percent >= 100 else "Занимается в своём темпе"),
    }


def list_lagging(
    db: Session,
    user: User,
    course_id: uuid.UUID | None,
    level: str | None,
    limit: int,
    offset: int,
    include_ok: bool = False,
) -> LagListOut:
    allowed = _allowed_courses(db, user)
    q = (
        select(Enrollment, User, Course, CourseProgress)
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        .outerjoin(CourseProgress, CourseProgress.enrollment_id == Enrollment.id)
    )
    if course_id:
        q = q.where(Enrollment.course_id == course_id)
    if allowed is not None:
        if not allowed:
            return LagListOut(items=[], total=0, limit=limit, offset=offset)
        q = q.where(Enrollment.course_id.in_(allowed))

    rows = db.execute(q).all()
    now = datetime.now(UTC)

    progress: dict[uuid.UUID, CourseProgress] = {}
    for enrollment, _student, _course, cp in rows:
        progress[enrollment.id] = cp or progress_service.recalculate(db, enrollment)

    by_course: dict[uuid.UUID, list[float]] = {}
    for enrollment, *_ in rows:
        by_course.setdefault(enrollment.course_id, []).append(float(progress[enrollment.id].percent))
    medians = {cid: statistics.median(v) for cid, v in by_course.items() if len(v) >= MIN_GROUP}
    steps_cache: dict[uuid.UUID, list[Step]] = {}

    items: list[dict] = []
    for enrollment, student, course, _cp in rows:
        if course.id not in steps_cache:
            steps_cache[course.id] = progress_service.ordered_steps(db, course.id)
        item = _analyze(db, enrollment, student, progress[enrollment.id], steps_cache[course.id], medians.get(course.id), now)
        if item["lag_level"] == "ok" and not include_ok and level != "ok":
            continue
        if level and item["lag_level"] != level:
            continue
        item.update(course_id=course.id, course_title=course.title)
        items.append(item)

    db.commit()
    items.sort(key=lambda i: (-_ORDER[i["lag_level"]], -i["days_since_progress"], i["student"]["full_name"]))
    total = len(items)
    return LagListOut(items=items[offset : offset + limit], total=total, limit=limit, offset=offset)
