from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password
from app.models.course import Course, CourseCurator, CourseStatus, Lesson, Module, Step
from app.models.progress import Enrollment, EnrollmentStatus
from app.models.user import User, UserRole
from app.slices.course_builder.schemas import (
    CourseCreate,
    CourseOut,
    CourseUpdate,
    LessonCreate,
    LessonOut,
    LessonUpdate,
    ModuleCreate,
    ModuleOut,
    ModuleUpdate,
    StepCreate,
    StepOut,
    StepUpdate,
    UserCreate,
)
from app.slices.progress import service as progress_service
from app.steps import registry


def _course_out(c: Course) -> CourseOut:
    return CourseOut(
        id=c.id,
        slug=c.slug,
        title=c.title,
        description=c.description,
        cover_url=c.cover_url,
        passport=c.passport or {},
        status=c.status.value,
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
        cover_url=data.cover_url,
        passport=data.passport,
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
                    "kind": s.kind,
                    "type": registry.step_type(s.kind, s.content),
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
        "cover_url": course.cover_url,
        "passport": course.passport or {},
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
    if data.cover_url is not None:
        course.cover_url = data.cover_url
    if data.passport is not None:
        course.passport = data.passport
    db.commit()
    db.refresh(course)
    return _course_out(course)


def publish_course(db: Session, course_id: uuid.UUID, published: bool = True) -> CourseOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.status = CourseStatus.published if published else CourseStatus.draft
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


def update_module(db: Session, module_id: uuid.UUID, data: ModuleUpdate) -> ModuleOut:
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if data.title is not None:
        module.title = data.title
    if data.position is not None:
        module.position = data.position
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


def update_lesson(db: Session, lesson_id: uuid.UUID, data: LessonUpdate) -> LessonOut:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if data.title is not None:
        lesson.title = data.title
    if data.position is not None:
        lesson.position = data.position
    db.commit()
    db.refresh(lesson)
    return LessonOut(id=lesson.id, module_id=lesson.module_id, title=lesson.title, position=lesson.position)


def add_step(db: Session, lesson_id: uuid.UUID, data: StepCreate) -> StepOut:
    if db.get(Lesson, lesson_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    if registry.get(data.kind) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid step kind")
    kind = data.kind
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
        kind=step.kind,
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
    if data.kind is not None:
        if registry.get(data.kind) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid step kind")
        step.kind = data.kind
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
        kind=step.kind,
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


def unassign_curator(db: Session, course_id: uuid.UUID, user_id: uuid.UUID) -> None:
    link = db.scalars(
        select(CourseCurator).where(CourseCurator.course_id == course_id, CourseCurator.user_id == user_id)
    ).first()
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curator is not assigned")
    db.delete(link)
    db.commit()


def course_people(db: Session, course_id: uuid.UUID) -> dict:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    curators = db.scalars(
        select(User).join(CourseCurator, CourseCurator.user_id == User.id).where(CourseCurator.course_id == course_id)
    ).all()
    students = db.execute(
        select(User, Enrollment).join(Enrollment, Enrollment.user_id == User.id).where(Enrollment.course_id == course_id)
    ).all()
    return {
        "curators": [{"id": u.id, "full_name": u.full_name, "email": u.email} for u in curators],
        "students": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
                "percent": float(e.progress.percent) if e.progress else 0.0,
            }
            for u, e in sorted(students, key=lambda r: r[0].full_name)
        ],
    }


def enroll_student(db: Session, course_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    course = db.get(Course, course_id)
    user = db.get(User, user_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if user is None or user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must be a student")
    enrollment = progress_service.get_enrollment(db, user_id, course_id)
    if enrollment is None:
        enrollment = Enrollment(user_id=user_id, course_id=course_id, status=EnrollmentStatus.active)
        db.add(enrollment)
        db.flush()
        progress_service.ensure_step_progress_rows(db, user_id, course_id)
        progress_service.recalculate(db, enrollment)
        db.commit()
    return {"course_id": course_id, "user_id": user_id, "enrollment_id": enrollment.id}


def unenroll_student(db: Session, course_id: uuid.UUID, user_id: uuid.UUID) -> None:
    enrollment = progress_service.get_enrollment(db, user_id, course_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled")
    # Прогресс по шагам остаётся в step_progress: если ученика вернут на курс, он продолжит с того же места
    db.delete(enrollment)
    db.commit()


def list_users(db: Session, role: str | None) -> list[dict]:
    q = select(User).order_by(User.full_name)
    if role:
        try:
            q = q.where(User.role == UserRole(role))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role") from exc
    users = db.scalars(q).all()
    titles = dict(db.execute(select(Course.id, Course.title)).all())
    curated: dict[uuid.UUID, list[uuid.UUID]] = {}
    for link in db.scalars(select(CourseCurator)).all():
        curated.setdefault(link.user_id, []).append(link.course_id)
    enrolled: dict[uuid.UUID, list[uuid.UUID]] = {}
    for e in db.scalars(select(Enrollment)).all():
        enrolled.setdefault(e.user_id, []).append(e.course_id)
    out = []
    for u in users:
        ids = curated.get(u.id, []) if u.role == UserRole.curator else enrolled.get(u.id, [])
        out.append(
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.value,
                "last_seen_at": u.last_seen_at.isoformat() if u.last_seen_at else None,
                "courses": [{"id": cid, "title": titles.get(cid, "")} for cid in ids],
            }
        )
    return out


def create_user(db: Session, data: UserCreate) -> dict:
    try:
        role = UserRole(data.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role") from exc
    email = data.email.lower()
    if db.scalars(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=email, full_name=data.full_name, role=role, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role.value, "courses": []}
