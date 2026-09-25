"""Синтетические демо-данные. Запуск: PYTHONPATH=. python -m app.seed.run [--force] [--legacy]

Курсы — базовый пакет учебного содержания Федерации (app/seed/package_courses.py).
Ученики и их прогресс вымышлены: разные состояния нужны, чтобы на стенде были видны очередь проверки,
возвращённые работы, отставание и рейтинг группы.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.course import Course, CourseCurator, CourseStatus, Lesson, Module, Step
from app.models.progress import CourseProgress, Enrollment, EnrollmentStatus, StepProgress, StepProgressStatus
from app.models.question import QuestionStatus, StepQuestion
from app.models.submission import CheckType, Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.seed.covers import write_seed_covers
from app.seed.package_courses import PACKAGE_COURSES
from app.slices.progress import service as progress_service
from app.steps import registry

DEMO_PASSWORD = "demo1234"
NOW = datetime.now(UTC)


def ago(days: float) -> datetime:
    return NOW - timedelta(days=days)


def _wipe(db: Session) -> None:

    db.execute(delete(StepQuestion))
    db.execute(delete(Submission))
    db.execute(delete(CourseProgress))
    db.execute(delete(StepProgress))
    db.execute(delete(Enrollment))
    db.execute(delete(CourseCurator))
    db.execute(delete(Step))
    db.execute(delete(Lesson))
    db.execute(delete(Module))
    db.execute(delete(Course))
    db.execute(delete(User))
    db.commit()


def _create_course(db: Session, spec: dict, admin: User, created_at: datetime) -> Course:
    course = Course(
        slug=spec["slug"],
        title=spec["title"],
        description=spec["description"],
        cover_url=spec.get("cover_url"),
        passport=spec.get("passport", {}),
        status=CourseStatus.published,
        created_by=admin.id,
        created_at=created_at,
    )
    db.add(course)
    db.flush()
    for mpos, mspec in enumerate(spec["modules"], start=1):
        module = Module(course_id=course.id, title=mspec["title"], position=mspec.get("position", mpos))
        db.add(module)
        db.flush()
        for lpos, lspec in enumerate(mspec["lessons"], start=1):
            lesson = Lesson(module_id=module.id, title=lspec["title"], position=lspec.get("position", lpos))
            db.add(lesson)
            db.flush()
            for spos, sspec in enumerate(lspec["steps"], start=1):
                kind = sspec["kind"]
                kind = kind.value if hasattr(kind, "value") else kind
                assert registry.get(kind), f"unknown kind {kind}"
                db.add(
                    Step(
                        lesson_id=lesson.id,
                        title=sspec["title"],
                        position=sspec.get("position", spos),
                        kind=kind,
                        content=sspec["content"],
                        max_score=sspec["max_score"],
                        is_required=sspec.get("is_required", True),
                    )
                )
    db.flush()
    return course



def correct_answers(step: Step) -> dict:
    c = step.content or {}
    if step.kind == "code":
        return {"code": c["reference_solution"], "language": "python"}
    if c.get("correct_option_ids"):
        return {"selected_option_ids": c["correct_option_ids"]}
    if c.get("options"):
        return {"selected_option_id": c["correct_option_id"]}
    return {"answer": c.get("correct_answer")}


def wrong_answers(step: Step) -> dict:
    c = step.content or {}
    if step.kind == "code":

        return {"code": "a = int(input())\nb = int(input())\nc = int(input())\nprint((a + b + c) // 2)\n", "language": "python"}
    if c.get("correct_option_ids"):
        return {"selected_option_ids": c["correct_option_ids"][:1]}
    if c.get("options"):
        wrong = next(o["id"] for o in c["options"] if o["id"] != c.get("correct_option_id"))
        return {"selected_option_id": wrong}
    return {"answer": "30"}


@dataclass
class Act:
    """Что ученик сделал на шаге. state: pass | fail | pending | accepted | returned"""

    state: str = "pass"
    days_ago: float = 1
    payload: dict = field(default_factory=dict)
    score: Decimal | None = None
    feedback: str = ""
    attempts: int = 1
    reviewed_days_ago: float | None = None


def play(db: Session, curator: User, student: User, course: Course, acts: list[Act]) -> Enrollment:
    """Записывает ученика на курс и проигрывает его действия по шагам курса по порядку."""
    enrollment = Enrollment(
        user_id=student.id, course_id=course.id, status=EnrollmentStatus.active, enrolled_at=ago(acts[0].days_ago + 1 if acts else 1)
    )
    db.add(enrollment)
    db.flush()
    steps = progress_service.ensure_step_progress_rows(db, student.id, course.id)
    rows = {sp.step_id: sp for sp in db.scalars(select(StepProgress).where(StepProgress.user_id == student.id)).all()}

    for step, act in zip(steps, acts, strict=False):
        sp = rows[step.id]
        when = ago(act.days_ago)
        checker = registry.get(step.kind)
        assert checker is not None
        sp.attempts_count = act.attempts

        if checker.mode == "none":
            sp.status = StepProgressStatus.passed
            sp.completed_at = when
        elif checker.mode == "auto":
            for i in range(act.attempts):
                last = i == act.attempts - 1
                ok = act.state == "pass" and last
                answers = correct_answers(step) if ok else wrong_answers(step)
                res = checker.grade(step.content, answers, Decimal(step.max_score))  # type: ignore[misc]
                assert res.passed == ok, f"{step.title}: ожидали {'успех' if ok else 'ошибку'}, получили {res.feedback}"
                t = when - timedelta(minutes=12 * (act.attempts - 1 - i))
                db.add(
                    Submission(
                        user_id=student.id,
                        step_id=step.id,
                        payload=answers,
                        check_type=CheckType.auto,
                        status=SubmissionStatus.graded,
                        score=res.score,
                        feedback=res.feedback,
                        result=res.details,
                        created_at=t,
                        reviewed_at=t,
                    )
                )
            if act.state == "pass":
                sp.status = StepProgressStatus.passed
                sp.score = sp.best_score = Decimal(step.max_score)
                sp.completed_at = when
            else:
                sp.status = StepProgressStatus.failed
                sp.score = Decimal("0")
        else:
            payload = act.payload or {"text": "Готово, ссылка ниже", "link": "https://scratch.mit.edu/projects/1000000001"}
            reviewed = ago(act.reviewed_days_ago) if act.reviewed_days_ago is not None else when + timedelta(hours=5)
            sub = Submission(
                user_id=student.id,
                step_id=step.id,
                payload=payload,
                check_type=CheckType.manual,
                status=SubmissionStatus.pending,
                created_at=when,
            )
            if act.state in ("accepted", "pass"):
                score = act.score if act.score is not None else Decimal(step.max_score)
                sub.status = SubmissionStatus.graded
                sub.score = score
                sub.feedback = act.feedback or "Всё по критериям, молодец!"
                sub.reviewed_by = curator.id
                sub.reviewed_at = reviewed
                sp.status = StepProgressStatus.passed
                sp.score = sp.best_score = score
                sp.completed_at = reviewed
            elif act.state == "returned":
                sub.status = SubmissionStatus.returned
                sub.feedback = act.feedback
                sub.reviewed_by = curator.id
                sub.reviewed_at = reviewed
                sp.status = StepProgressStatus.returned
            else:
                sp.status = StepProgressStatus.submitted
            db.add(sub)
        db.add(sp)

    db.flush()
    progress_service.unlock_next(db, student.id, course.id)
    progress_service.recalculate(db, enrollment)
    return enrollment


SCRATCH_LINK = "https://scratch.mit.edu/projects/1000000{}"
MAKECODE_LINK = "https://makecode.com/_{}"


def seed(*, force: bool = False, legacy: bool = False) -> None:
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

        def user(email: str, name: str, role: UserRole, seen_days: float | None) -> User:
            u = User(
                email=email,
                password_hash=hash_password(DEMO_PASSWORD),
                full_name=name,
                role=role,
                last_seen_at=ago(seen_days) if seen_days is not None else None,
            )
            db.add(u)
            return u

        admin = user("admin@example.com", "Ольга Админова", UserRole.admin, 0)
        curator = user("curator@example.com", "Елена Кураторова", UserRole.curator, 0)
        curator2 = user("curator2@example.com", "Сергей Наставников", UserRole.curator, 1)
        anna = user("student@example.com", "Анна Смирнова", UserRole.student, 0)
        ivan = user("ivan@example.com", "Иван Петров", UserRole.student, 0.2)
        maria = user("maria@example.com", "Мария Козлова", UserRole.student, 0.1)
        dima = user("dima@example.com", "Дмитрий Волков", UserRole.student, 0.3)
        sofia = user("sofia@example.com", "Софья Новикова", UserRole.student, 9)
        artem = user("artem@example.com", "Артём Морозов", UserRole.student, 0.5)
        polina = user("polina@example.com", "Полина Лебедева", UserRole.student, 0.2)
        kirill = user("kirill@example.com", "Кирилл Соколов", UserRole.student, 1)
        eva = user("eva@example.com", "Ева Павлова", UserRole.student, 4)
        timur = user("timur@example.com", "Тимур Егоров", UserRole.student, 0.4)
        user("new@example.com", "Никита Новый", UserRole.student, None)
        db.flush()

        specs = list(PACKAGE_COURSES)
        specs[1] = {**specs[1], "cover_url": covers.get("minecraft-agent")}
        courses: list[Course] = []
        for i, spec in enumerate(specs):
            courses.append(_create_course(db, spec, admin, ago(30 - i)))
        scratch, mc, algo = courses
        for c in courses:
            db.add(CourseCurator(course_id=c.id, user_id=curator.id))
        db.add(CourseCurator(course_id=algo.id, user_id=curator2.id))

        if legacy:
            from app.seed.courses_data import course_specs

            for i, spec in enumerate(course_specs(covers)):
                c = _create_course(db, spec, admin, ago(40 - i))
                db.add(CourseCurator(course_id=c.id, user_id=curator.id))

        A = Act

        play(db, curator, anna, scratch, [
            A(days_ago=6), A(days_ago=6), A(days_ago=6, attempts=2),
            A(days_ago=5), A(days_ago=5),
            A("accepted", 4, {"text": "Поставила повторить 3 раз и угол 120", "link": SCRATCH_LINK.format(101)}, Decimal("9"),
              "Треугольник замкнулся, цикл на месте. Балл сняла за то, что забыла «стереть всё» в начале."),
            A("returned", 2, {"text": "Кот ходит по кругу", "link": SCRATCH_LINK.format(102)}, None,
              "Цикл повторяется 100 раз, а нужно 120: 360 ÷ 3. Поправь число и добавь «говорить Круг!» после цикла.",
              reviewed_days_ago=1),
            A(days_ago=1),
        ])
        play(db, curator, maria, scratch, [
            A(days_ago=9), A(days_ago=9), A(days_ago=8), A(days_ago=8), A(days_ago=7),
            A("accepted", 6, {"text": "Треугольник", "link": SCRATCH_LINK.format(201)}),
            A("accepted", 5, {"text": "120 раз", "link": SCRATCH_LINK.format(202)}, Decimal("10")),
            A(days_ago=3), A(days_ago=3),
            A("pending", 0.8, {"text": "Добавила звук при поимке и экран «Игра окончена»", "link": SCRATCH_LINK.format(203)}),
        ])
        play(db, curator, dima, scratch, [
            A(days_ago=7), A(days_ago=7), A(days_ago=6), A(days_ago=6),
            A("fail", 0.3, attempts=4),
        ])
        play(db, curator, sofia, scratch, [A(days_ago=11), A(days_ago=11), A(days_ago=10, attempts=3)])
        play(db, curator, timur, scratch, [
            A(days_ago=8), A(days_ago=8), A(days_ago=8), A(days_ago=7), A(days_ago=7),
            A("returned", 5, {"text": "Нарисовал", "link": SCRATCH_LINK.format(301)}, None,
              "Поворот на 60 градусов — фигура не замыкается. Подумай, на сколько нужно повернуть, чтобы обойти треугольник.",
              reviewed_days_ago=4),
            A("pending", 0.4, {"text": "Кот по кругу, 120 повторов", "link": SCRATCH_LINK.format(302)}),
        ])

        play(db, curator, ivan, mc, [
            A(days_ago=3), A(days_ago=3),
            A("pending", 0.2, {"text": "Дорожка из 10 блоков, команда «дорога»", "link": MAKECODE_LINK.format("Dorog4aA1"),
                               "screenshot_url": covers.get("minecraft-agent")}),
        ])
        play(db, curator, artem, mc, [
            A(days_ago=8), A(days_ago=8),
            A("accepted", 6, {"text": "Готово", "link": MAKECODE_LINK.format("Art3m"), "screenshot_url": covers.get("minecraft-agent")}, Decimal("15")),
            A(days_ago=5),
        ])
        play(db, curator, polina, mc, [
            A(days_ago=6), A(days_ago=6),
            A("accepted", 5, {"text": "Дорожка", "link": MAKECODE_LINK.format("P0lina1"), "screenshot_url": covers.get("minecraft-agent")}, Decimal("14"),
              "Всё работает. Один балл — за то, что агент ставит блок до перемещения только со второго запуска."),
            A(days_ago=4), A(days_ago=3),
            A("pending", 1.3, {"text": "Стена 5 × 3, цикл в цикле. Направление поменяла на «вперёд»",
                               "link": MAKECODE_LINK.format("P0lina2"), "screenshot_url": covers.get("minecraft-agent")}),
        ])
        play(db, curator, anna, mc, [A(days_ago=2), A(days_ago=2)])

        play(db, curator, anna, algo, [A(days_ago=3), A(days_ago=3), A(days_ago=2), A("fail", 0.1, attempts=1)])
        play(db, curator, ivan, algo, [
            A(days_ago=12), A(days_ago=12), A(days_ago=11), A(days_ago=10, attempts=2),
            A(days_ago=8), A(days_ago=8), A(days_ago=6), A(days_ago=4, attempts=3),
            A(days_ago=2), A(days_ago=1),
        ])
        play(db, curator, kirill, algo, [A(days_ago=14 - i * 1.1) for i in range(12)])
        play(db, curator, eva, algo, [A(days_ago=6), A(days_ago=6)])
        play(db, curator, dima, algo, [A(days_ago=5), A(days_ago=5), A(days_ago=5)])

        db.flush()

        def step_by_title(course: Course, title: str) -> Step:
            return next(s for s in progress_service.ordered_steps(db, course.id) if s.title == title)

        db.add_all([
            StepQuestion(
                step_id=step_by_title(algo, "Задача: парты").id, course_id=algo.id, user_id=anna.id,
                text="Почему у меня на тесте 1 выходит 31, а не 32? Я складываю всех учеников и делю на 2.",
                created_at=ago(0.05),
            ),
            StepQuestion(
                step_id=step_by_title(mc, "Задание в мире: первая дорожка").id, course_id=mc.id, user_id=ivan.id,
                text="Агент ставит только один блок, а потом ничего. Что не так?",
                status=QuestionStatus.answered,
                answer="Проверь, что агенту выдан камень: блок «задать предмет агента» — камень, 64 штуки, слот 1. Без материала он ставит блок только если что-то уже есть в слоте.",
                answered_by=curator.id, created_at=ago(0.6), answered_at=ago(0.4),
            ),
            StepQuestion(
                step_id=step_by_title(scratch, "Разбор: от квадрата к треугольнику").id, course_id=scratch.id, user_id=timur.id,
                text="А почему не 60 градусов? У треугольника же углы по 60.",
                created_at=ago(0.3),
            ),
        ])

        db.commit()
        print("Seed OK")
        for c in courses:
            print(f"  - {c.slug}: {c.title}")
        print(f"  accounts (password {DEMO_PASSWORD}): admin@, curator@, curator2@, student@ (Анна), ivan@, maria@ … example.com")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Wipe and recreate demo data")
    parser.add_argument("--legacy", action="store_true", help="Also add the old placeholder courses")
    args = parser.parse_args()
    seed(force=args.force, legacy=args.legacy)
