import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.course import Lesson, Module, Step
from app.models.user import User, UserRole
from app.slices.course_builder import service
from app.slices.course_builder.schemas import (
    CourseCreate,
    CourseOut,
    CourseUpdate,
    CuratorAssign,
    LessonCreate,
    LessonOut,
    ModuleCreate,
    ModuleOut,
    StepCreate,
    StepOut,
    StepUpdate,
)

router = APIRouter()
admin_dep = require_roles(UserRole.admin)


@router.get("/courses", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> list[CourseOut]:
    return service.list_courses(db)


@router.post("/courses", response_model=CourseOut, status_code=201)
def create_course(
    body: CourseCreate, db: Session = Depends(get_db), user: User = Depends(admin_dep)
) -> CourseOut:
    return service.create_course(db, body, user)


@router.get("/courses/{course_id}")
def get_course(course_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> dict:
    return service.get_course_tree(db, course_id)


@router.patch("/courses/{course_id}", response_model=CourseOut)
def patch_course(
    course_id: uuid.UUID,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> CourseOut:
    return service.update_course(db, course_id, body)


@router.post("/courses/{course_id}/publish", response_model=CourseOut)
def publish(course_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> CourseOut:
    return service.publish_course(db, course_id)


@router.post("/courses/{course_id}/modules", response_model=ModuleOut, status_code=201)
def create_module(
    course_id: uuid.UUID,
    body: ModuleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> ModuleOut:
    return service.add_module(db, course_id, body)


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(module_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> None:
    service.delete_entity(db, Module, module_id, "Module")


@router.post("/modules/{module_id}/lessons", response_model=LessonOut, status_code=201)
def create_lesson(
    module_id: uuid.UUID,
    body: LessonCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> LessonOut:
    return service.add_lesson(db, module_id, body)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> None:
    service.delete_entity(db, Lesson, lesson_id, "Lesson")


@router.post("/lessons/{lesson_id}/steps", response_model=StepOut, status_code=201)
def create_step(
    lesson_id: uuid.UUID,
    body: StepCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> StepOut:
    return service.add_step(db, lesson_id, body)


@router.patch("/steps/{step_id}", response_model=StepOut)
def patch_step(
    step_id: uuid.UUID,
    body: StepUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> StepOut:
    return service.update_step(db, step_id, body)


@router.delete("/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_step(step_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(admin_dep)) -> None:
    service.delete_entity(db, Step, step_id, "Step")


@router.post("/courses/{course_id}/curators", status_code=201)
def assign_curator(
    course_id: uuid.UUID,
    body: CuratorAssign,
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> dict:
    return service.assign_curator(db, course_id, body.user_id)
