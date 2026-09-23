from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, CourseStatus, Lesson, Module
from app.models.progress import Enrollment, EnrollmentStatus, StepProgress, StepProgressStatus
from app.models.user import User, UserRole
from app.slices.catalog.schemas import (
    CatalogCourseItem,
    CatalogListOut,
    EnrollmentBrief,
    EnrollmentOut,
    NextStepOut,
    OutlineLesson,
    OutlineModule,
    OutlineOut,
    OutlineStep,
    StepProgressBrief,
)
from app.slices.progress import service as progress_service


def list_courses(db: Session, user: User, limit: int, offset: int) -> CatalogListOut:
    q = select(Course).where(Course.status == CourseStatus.published).order_by(Course.title)
    total = db.scalar(select(func.count()).select_from(Course).where(Course.status == CourseStatus.published)) or 0
    courses = db.scalars(q.limit(limit).offset(offset)).all()

    enrollments = {
        e.course_id: e
        for e in db.scalars(select(Enrollment).where(Enrollment.user_id == user.id)).all()
    }
    items: list[CatalogCourseItem] = []
    for c in courses:
        enr = enrollments.get(c.id)
        brief = None
        if enr:
            cp = enr.progress
            if cp is None:
                cp = progress_service.recalculate(db, enr)
            brief = EnrollmentBrief(
                id=enr.id,
                status=enr.status.value,
                percent=cp.percent if cp else Decimal("0"),
                rating_score=cp.rating_score if cp else Decimal("0"),
            )
        items.append(
            CatalogCourseItem(
                id=c.id,
                slug=c.slug,
                title=c.title,
                description=c.description,
                cover_url=c.cover_url,
                status=c.status.value,
                enrollment=brief,
            )
        )
    db.commit()
    return CatalogListOut(items=items, total=total, limit=limit, offset=offset)


def enroll(db: Session, user: User, course_id: uuid.UUID) -> EnrollmentOut:
    if user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can enroll")
    course = db.get(Course, course_id)
    if course is None or course.status != CourseStatus.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    existing = progress_service.get_enrollment(db, user.id, course_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")

    enrollment = Enrollment(user_id=user.id, course_id=course_id, status=EnrollmentStatus.active)
    db.add(enrollment)
    db.flush()
    progress_service.ensure_step_progress_rows(db, user.id, course_id)
    progress_service.recalculate(db, enrollment)
    db.commit()
    db.refresh(enrollment)
    return EnrollmentOut(
        id=enrollment.id,
        course_id=enrollment.course_id,
        status=enrollment.status.value,
        enrolled_at=enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else datetime.utcnow().isoformat(),
    )


def outline(db: Session, user: User, course_id: uuid.UUID) -> OutlineOut:
    course = db.scalars(
        select(Course)
        .where(Course.id == course_id)
        .options(joinedload(Course.modules).joinedload(Module.lessons).joinedload(Lesson.steps))
    ).unique().first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.status != CourseStatus.published and user.role == UserRole.student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    progress_map: dict[uuid.UUID, StepProgress] = {}
    if enrollment:
        progress_service.ensure_step_progress_rows(db, user.id, course_id)
        progress_map = {
            sp.step_id: sp
            for sp in db.scalars(select(StepProgress).where(StepProgress.user_id == user.id)).all()
        }
        db.commit()

    modules_out: list[OutlineModule] = []
    for m in sorted(course.modules, key=lambda x: x.position):
        lessons_out: list[OutlineLesson] = []
        for les in sorted(m.lessons, key=lambda x: x.position):
            steps_out: list[OutlineStep] = []
            for s in sorted(les.steps, key=lambda x: x.position):
                sp = progress_map.get(s.id)
                steps_out.append(
                    OutlineStep(
                        id=s.id,
                        title=s.title,
                        position=s.position,
                        kind=s.kind.value,
                        max_score=s.max_score,
                        is_required=s.is_required,
                        progress=StepProgressBrief(
                            status=sp.status.value if sp else StepProgressStatus.locked.value,
                            score=sp.score if sp else None,
                            best_score=sp.best_score if sp else None,
                        ),
                    )
                )
            lessons_out.append(
                OutlineLesson(id=les.id, title=les.title, position=les.position, steps=steps_out)
            )
        modules_out.append(
            OutlineModule(id=m.id, title=m.title, position=m.position, lessons=lessons_out)
        )

    return OutlineOut(
        course={
            "id": course.id,
            "title": course.title,
            "slug": course.slug,
            "status": course.status.value,
            "cover_url": course.cover_url,
            "description": course.description,
        },
        modules=modules_out,
    )


_HINTS = {
    "theory": "Прочитайте материал и отметьте шаг выполненным",
    "quiz": "Пройдите квиз и отправьте ответы",
    "task": "Отправьте решение на проверку куратору",
    "code": "Отправьте решение на автопроверку",
}


def next_step(db: Session, user: User, course_id: uuid.UUID) -> NextStepOut:
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")
    cp = progress_service.recalculate(db, enrollment)
    db.commit()

    if cp.current_step_id is None:
        return NextStepOut(course_id=course_id, percent=cp.percent, current_step=None, message="Курс пройден")

    from app.models.course import Step

    step = db.get(Step, cp.current_step_id)
    if step is None:
        return NextStepOut(course_id=course_id, percent=cp.percent, current_step=None, message="Курс пройден")

    sp = db.scalars(
        select(StepProgress).where(StepProgress.user_id == user.id, StepProgress.step_id == step.id)
    ).first()
    lesson = db.get(Lesson, step.lesson_id)
    module = db.get(Module, lesson.module_id) if lesson else None
    return NextStepOut(
        course_id=course_id,
        percent=cp.percent,
        current_step={
            "id": step.id,
            "title": step.title,
            "kind": step.kind.value,
            "lesson_id": step.lesson_id,
            "module_id": module.id if module else None,
            "status": sp.status.value if sp else "available",
            "action_hint": _HINTS.get(step.kind.value, "Продолжайте обучение"),
        },
        message=f"Следующий шаг: {step.title}",
    )
