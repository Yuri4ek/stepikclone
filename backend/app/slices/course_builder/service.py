from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, CourseCurator, CourseStatus, Lesson, Module, Step, StepKind
from app.models.user import User, UserRole
from app.slices.course_builder.schemas import (
    CourseCreate,
    CourseOut,
    CourseUpdate,
    LessonCreate,
    LessonOut,
    ModuleCreate,
    ModuleOut,
    StepCreate,
    StepOut,
    StepUpdate,
)


def _course_out(c: Course) -> CourseOut:
    return CourseOut(
        id=c.id, slug=c.slug, title=c.title, description=c.description, status=c.status.value
    )


def list_courses(db: Session) -> list[CourseOut]:
    rows = db.scalars(select(Course).order_by(Course.created_at.desc())).all()
    return [_course_out(c) for c in rows]


def create_course(db: Session, data: CourseCreate, admin: User) -> CourseOut:
    if db.scalars(select(Course).where(Course.slug == data.slug)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    course = Course(
        title=data.title,
        slug=data.slug,
        description=data.description,
        created_by=admin.id,
        status=CourseStatus.draft,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return _course_out(course)


def get_course_tree(db: Session, course_id: uuid.UUID) -> dict:
    course = db.scalars(
        select(Course)
        .where(Course.id == course_id)
        .options(joinedload(Course.modules).joinedload(Module.lessons).joinedload(Lesson.steps))
    ).unique().first()
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    modules = []
    for m in sorted(course.modules, key=lambda x: x.position):
        lessons = []
        for les in sorted(m.lessons, key=lambda x: x.position):
            steps = [
                {
                    "id": s.id,
                    "title": s.title,
                    "position": s.position,
                    "kind": s.kind.value,
                    "max_score": s.max_score,
                    "is_required": s.is_required,
                    "content": s.content,
                }
                for s in sorted(les.steps, key=lambda x: x.position)
            ]
            lessons.append({"id": les.id, "title": les.title, "position": les.position, "steps": steps})
        modules.append({"id": m.id, "title": m.title, "position": m.position, "lessons": lessons})
    return {
        "id": course.id,
        "slug": course.slug,
        "title": course.title,
        "description": course.description,
        "status": course.status.value,
        "modules": modules,
    }


def update_course(db: Session, course_id: uuid.UUID, data: CourseUpdate) -> CourseOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if data.title is not None:
        course.title = data.title
    if data.description is not None:
        course.description = data.description
    db.commit()
    db.refresh(course)
    return _course_out(course)


def publish_course(db: Session, course_id: uuid.UUID) -> CourseOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = CourseStatus.published
    db.commit()
    db.refresh(course)
    return _course_out(course)


def add_module(db: Session, course_id: uuid.UUID, data: ModuleCreate) -> ModuleOut:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    module = Module(course_id=course_id, title=data.title, position=data.position)
    db.add(module)
    db.commit()
    db.refresh(module)
    return ModuleOut(id=module.id, course_id=module.course_id, title=module.title, position=module.position)


def add_lesson(db: Session, module_id: uuid.UUID, data: LessonCreate) -> LessonOut:
    if db.get(Module, module_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    lesson = Lesson(module_id=module_id, title=data.title, position=data.position)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonOut(id=lesson.id, module_id=lesson.module_id, title=lesson.title, position=lesson.position)


def add_step(db: Session, lesson_id: uuid.UUID, data: StepCreate) -> StepOut:
    if db.get(Lesson, lesson_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    try:
        kind = StepKind(data.kind)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid step kind") from exc
    step = Step(
        lesson_id=lesson_id,
        title=data.title,
        position=data.position,
        kind=kind,
        content=data.content,
        max_score=data.max_score,
        is_required=data.is_required,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return StepOut(
        id=step.id,
        lesson_id=step.lesson_id,
        title=step.title,
        position=step.position,
        kind=step.kind.value,
        max_score=step.max_score,
        is_required=step.is_required,
        content=step.content,
    )


def update_step(db: Session, step_id: uuid.UUID, data: StepUpdate) -> StepOut:
    step = db.get(Step, step_id)
    if step is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    if data.title is not None:
        step.title = data.title
    if data.position is not None:
        step.position = data.position
    if data.content is not None:
        step.content = data.content
    if data.max_score is not None:
        step.max_score = data.max_score
    if data.is_required is not None:
        step.is_required = data.is_required
    db.commit()
    db.refresh(step)
    return StepOut(
        id=step.id,
        lesson_id=step.lesson_id,
        title=step.title,
        position=step.position,
        kind=step.kind.value,
        max_score=step.max_score,
        is_required=step.is_required,
        content=step.content,
    )


def delete_entity(db: Session, model, entity_id: uuid.UUID, label: str) -> None:
    obj = db.get(model, entity_id)
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found")
    db.delete(obj)
    db.commit()


def assign_curator(db: Session, course_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    course = db.get(Course, course_id)
    user = db.get(User, user_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if user is None or user.role != UserRole.curator:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must be a curator")
    existing = db.scalars(
        select(CourseCurator).where(CourseCurator.course_id == course_id, CourseCurator.user_id == user_id)
    ).first()
    if existing:
        return {"course_id": course_id, "user_id": user_id}
    db.add(CourseCurator(course_id=course_id, user_id=user_id))
    db.commit()
    return {"course_id": course_id, "user_id": user_id}
