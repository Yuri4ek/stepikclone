"""Синтетические демо-данные. Запуск: PYTHONPATH=. python -m app.seed.run [--force]"""

from __future__ import annotations

import argparse
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.course import Course, CourseCurator, CourseStatus, Lesson, Module, Step
from app.models.progress import CourseProgress, Enrollment, EnrollmentStatus, StepProgress
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.seed.covers import write_seed_covers
from app.seed.courses_data import course_specs
from app.slices.progress import service as progress_service

DEMO_PASSWORD = "demo1234"


def _wipe(db) -> None:
    # порядок с учётом FK
    db.execute(delete(Submission))
    db.execute(delete(StepProgress))
    db.execute(delete(CourseProgress))
    db.execute(delete(Enrollment))
    db.execute(delete(CourseCurator))
    db.execute(delete(Step))
    db.execute(delete(Lesson))
    db.execute(delete(Module))
    db.execute(delete(Course))
    db.execute(delete(User))
    db.commit()


def seed(*, force: bool = False) -> None:
    db = SessionLocal()
    try:
        existing = db.scalars(select(User).where(User.email == "admin@example.com")).first()
        if existing and not force:
            print("Seed already applied (use --force to recreate)")
            return
        if existing and force:
            print("Force reseed: wiping demo tables…")
            _wipe(db)

        covers = write_seed_covers()

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
            last_seen_at=datetime.now(UTC) - timedelta(days=5),
        )
        student2 = User(
            email="ivan@example.com",
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="Иван Ученик",
            role=UserRole.student,
            last_seen_at=datetime.now(UTC) - timedelta(days=2),
        )
        db.add_all([admin, curator, student, student2])
        db.flush()

        created_courses: list[Course] = []
        for spec in course_specs(covers):
            course = Course(
                slug=spec["slug"],
                title=spec["title"],
                description=spec["description"],
                cover_url=spec.get("cover_url"),
                status=CourseStatus.published,
                created_by=admin.id,
            )
            db.add(course)
            db.flush()
            for mspec in spec["modules"]:
                module = Module(course_id=course.id, title=mspec["title"], position=mspec["position"])
                db.add(module)
                db.flush()
                for lspec in mspec["lessons"]:
                    lesson = Lesson(module_id=module.id, title=lspec["title"], position=lspec["position"])
                    db.add(lesson)
                    db.flush()
                    for sspec in lspec["steps"]:
                        db.add(
                            Step(
                                lesson_id=lesson.id,
                                title=sspec["title"],
                                position=sspec["position"],
                                kind=sspec["kind"],
                                content=sspec["content"],
                                max_score=sspec["max_score"],
                                is_required=True,
                            )
                        )
            db.add(CourseCurator(course_id=course.id, user_id=curator.id))
            created_courses.append(course)

        db.flush()

        # Анна — на первых двух курсах; Иван — на codeolymp
        enroll_pairs = [
            (student, created_courses[0]),
            (student, created_courses[1]),
            (student2, created_courses[2]),
        ]
        for user, course in enroll_pairs:
            enrollment = Enrollment(user_id=user.id, course_id=course.id, status=EnrollmentStatus.active)
            db.add(enrollment)
            db.flush()
            progress_service.ensure_step_progress_rows(db, user.id, course.id)
            progress_service.recalculate(db, enrollment)

        db.commit()
        print("Seed OK")
        print(f"  courses: {len(created_courses)}")
        for c in created_courses:
            print(f"    - {c.slug}: {c.title}")
        print("  accounts (password demo1234):")
        print("    admin@example.com")
        print("    curator@example.com")
        print("    student@example.com")
        print("    ivan@example.com")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Wipe and recreate demo data")
    args = parser.parse_args()
    seed(force=args.force)
