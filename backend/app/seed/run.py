"""Синтетические демо-данные для локального стенда."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.course import Course, CourseCurator, CourseStatus, Lesson, Module, Step, StepKind
from app.models.progress import Enrollment, EnrollmentStatus
from app.models.user import User, UserRole
from app.slices.progress import service as progress_service

DEMO_PASSWORD = "demo1234"


def seed() -> None:
    db = SessionLocal()
    try:
        if db.scalars(select(User).where(User.email == "admin@example.com")).first():
            print("Seed already applied")
            return

        admin = User(
            email="admin@example.com",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="Админ Демо",
            role=UserRole.admin,
        )
        curator = User(
            email="curator@example.com",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="Куратор Демо",
            role=UserRole.curator,
            last_seen_at=datetime.now(UTC),
        )
        student = User(
            email="student@example.com",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="Анна Ученица",
            role=UserRole.student,
            # специально «устаревшая» активность — чтобы /lag что-то показал
            last_seen_at=datetime.now(UTC) - timedelta(days=5),
        )
        db.add_all([admin, curator, student])
        db.flush()

        course = Course(
            slug="olymp-math-start",
            title="Олимпиадная математика: старт",
            description="Демо-курс для проверки ядра платформы",
            status=CourseStatus.published,
            created_by=admin.id,
        )
        db.add(course)
        db.flush()

        module = Module(course_id=course.id, title="Модуль 1. Основы", position=1)
        db.add(module)
        db.flush()

        lesson = Lesson(module_id=module.id, title="Урок 1. Дроби", position=1)
        db.add(lesson)
        db.flush()

        steps = [
            Step(
                lesson_id=lesson.id,
                title="Теория: обыкновенные дроби",
                position=1,
                kind=StepKind.theory,
                content={"markdown": "# Дроби\n\nОбыкновенная дробь — это запись вида a/b."},
                max_score=Decimal("0"),
                is_required=True,
            ),
            Step(
                lesson_id=lesson.id,
                title="Квиз: сумма дробей",
                position=2,
                kind=StepKind.quiz,
                content={
                    "question": "Сколько будет 1/2 + 1/2?",
                    "options": [{"id": "a", "text": "1"}, {"id": "b", "text": "2"}, {"id": "c", "text": "1/4"}],
                    "correct_option_id": "a",
                },
                max_score=Decimal("10"),
                is_required=True,
            ),
            Step(
                lesson_id=lesson.id,
                title="Задача: решение с обоснованием",
                position=3,
                kind=StepKind.task,
                content={
                    "markdown": "Решите задачу и кратко обоснуйте ответ.",
                    "criteria": "Правильный ответ и наличие обоснования",
                },
                max_score=Decimal("20"),
                is_required=True,
            ),
        ]
        db.add_all(steps)
        db.add(CourseCurator(course_id=course.id, user_id=curator.id))

        enrollment = Enrollment(user_id=student.id, course_id=course.id, status=EnrollmentStatus.active)
        db.add(enrollment)
        db.flush()
        progress_service.ensure_step_progress_rows(db, student.id, course.id)
        progress_service.recalculate(db, enrollment)
        db.commit()
        print("Seed OK")
        print("  admin@example.com / demo1234")
        print("  curator@example.com / demo1234")
        print("  student@example.com / demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
