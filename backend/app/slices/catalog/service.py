from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, CourseStatus, Lesson, Module, Step
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
from app.steps import registry


def list_courses(db: Session, user: User, limit: int, offset: int) -> CatalogListOut:
    enrollments = {
        e.course_id: e
        for e in db.scalars(select(Enrollment).where(Enrollment.user_id == user.id)).all()
    }
    # Снятый с публикации курс остаётся у тех, кто уже на нём учится
    visible = or_(Course.status == CourseStatus.published, Course.id.in_(list(enrollments)))
    q = select(Course).where(visible).order_by(Course.created_at, Course.title)
    total = db.scalar(select(func.count()).select_from(Course).where(visible)) or 0
    courses = db.scalars(q.limit(limit).offset(offset)).all()

    counts = dict(
        db.execute(
            select(Module.course_id, func.count(Step.id))
            .join(Lesson, Lesson.module_id == Module.id)
            .join(Step, Step.lesson_id == Lesson.id)
            .where(Module.course_id.in_([c.id for c in courses]))
            .group_by(Module.course_id)
        ).all()
    )
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
                passport=c.passport or {},
                steps_total=counts.get(c.id, 0),
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
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    if course.status != CourseStatus.published and user.role == UserRole.student and enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
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
                        kind=s.kind,
                        type=registry.step_type(s.kind, s.content),
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
            "passport": course.passport or {},
        },
        modules=modules_out,
    )


_HINTS = {
    "theory": "Прочитай материал и нажми «Готово»",
    "quiz": "Ответь — результат будет сразу",
    "code": "Напиши решение — тесты проверят его сразу",
    "task": "Сдай работу куратору. Дальше можно идти, не дожидаясь проверки",
}
_STATUS_HINTS = {
    "failed": "Прошлая попытка не прошла — попробуй ещё раз",
    "returned": "Куратор вернул работу — поправь и отправь снова",
}


def _hint(kind: str, step_status: str) -> str:
    return _STATUS_HINTS.get(step_status) or _HINTS.get(kind, "Продолжай обучение")


def next_step(db: Session, user: User, course_id: uuid.UUID) -> NextStepOut:
    enrollment = progress_service.get_enrollment(db, user.id, course_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")
    cp = progress_service.recalculate(db, enrollment)
    db.commit()

    step = db.get(Step, cp.current_step_id) if cp.current_step_id else None
    if step is None:
        waiting = db.scalar(
            select(func.count())
            .select_from(StepProgress)
            .where(
                StepProgress.user_id == user.id,
                StepProgress.status == StepProgressStatus.submitted,
                StepProgress.step_id.in_([s.id for s in progress_service.ordered_steps(db, course_id)]),
            )
        )
        message = "Все шаги сданы, ждём проверку куратора" if waiting else "Курс пройден"
        return NextStepOut(course_id=course_id, percent=cp.percent, current_step=None, message=message)

    sp = db.scalars(
        select(StepProgress).where(StepProgress.user_id == user.id, StepProgress.step_id == step.id)
    ).first()
    lesson = db.get(Lesson, step.lesson_id)
    module = db.get(Module, lesson.module_id) if lesson else None
    step_status = sp.status.value if sp else "available"
    return NextStepOut(
        course_id=course_id,
        percent=cp.percent,
        current_step={
            "id": step.id,
            "title": step.title,
            "kind": step.kind,
            "type": registry.step_type(step.kind, step.content),
            "lesson_id": step.lesson_id,
            "module_id": module.id if module else None,
            "module_title": module.title if module else None,
            "status": step_status,
            "action_hint": _hint(step.kind, step_status),
        },
        message=f"Следующий шаг: {step.title}",
    )
