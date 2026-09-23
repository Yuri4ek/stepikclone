from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseCurator, Step
from app.models.progress import CourseProgress, Enrollment
from app.models.user import User, UserRole
from app.slices.lag.schemas import LagListOut
from app.slices.progress import service as progress_service

WARNING_DAYS = 3
CRITICAL_DAYS = 7


def _allowed_courses(db: Session, user: User) -> list[uuid.UUID] | None:
    if user.role == UserRole.admin:
        return None
    if user.role != UserRole.curator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Curators only")
    return list(db.scalars(select(CourseCurator.course_id).where(CourseCurator.user_id == user.id)).all())


def list_lagging(
    db: Session,
    user: User,
    course_id: uuid.UUID | None,
    level: str | None,
    limit: int,
    offset: int,
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
    items: list[dict] = []
    for enrollment, student, course, cp in rows:
        if cp is None:
            progress_service.ensure_step_progress_rows(db, student.id, course.id)
            cp = progress_service.recalculate(db, enrollment)

        last_seen = student.last_seen_at or enrollment.enrolled_at
        if last_seen is not None and last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=UTC)
        days = (now - last_seen).days if last_seen else 0

        lag_level = "ok"
        reason = "Активность в норме"
        if days >= CRITICAL_DAYS and float(cp.percent) < 100:
            lag_level = "critical"
            reason = f"Нет активности {days} дней при прогрессе {float(cp.percent)}%"
        elif days >= WARNING_DAYS and float(cp.percent) < 100:
            lag_level = "warning"
            reason = f"Нет активности {days} дней при прогрессе {float(cp.percent)}%"
        elif float(cp.percent) < 20 and days >= 2:
            lag_level = "warning"
            reason = f"Низкий прогресс ({float(cp.percent)}%) и слабая активность"

        if lag_level == "ok":
            continue
        if level and lag_level != level:
            continue

        step_title = None
        if cp.current_step_id:
            step = db.get(Step, cp.current_step_id)
            step_title = step.title if step else None

        items.append(
            {
                "enrollment_id": enrollment.id,
                "course_id": course.id,
                "course_title": course.title,
                "student": {
                    "id": student.id,
                    "full_name": student.full_name,
                    "email": student.email,
                },
                "percent": float(cp.percent),
                "days_since_activity": days,
                "lag_level": lag_level,
                "current_step_title": step_title,
                "last_seen_at": last_seen.isoformat() if last_seen else None,
                "reason": reason,
            }
        )

    db.commit()
    total = len(items)
    return LagListOut(items=items[offset : offset + limit], total=total, limit=limit, offset=offset)
