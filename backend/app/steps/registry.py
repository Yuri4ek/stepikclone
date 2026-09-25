"""Реестр механизмов проверки шагов.

Шаг описывается двумя полями:
  * ``kind`` — механизм проверки (как платформа засчитывает шаг). Он живёт здесь, в реестре;
  * ``content.type`` — как шаг выглядит у ученика (Scratch, Minecraft, задача с тестами…).
    Это свободная строка: фронтенд подбирает по ней редактор и плеер.

Новый тип шага на существующем механизме (например, «Робототехника» с ручной проверкой) — это только
новое значение content.type, бэкенд и БД не меняются. Новый механизм проверки — одна запись ``register(...)``
в этом файле: колонка steps.kind — строка, миграция не нужна.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from decimal import Decimal

from app.steps import judge

# Поля content, которые видят только куратор и система проверки (блоки «Правильный ответ»,
# «Критерии проверки», «Эталонное решение» из пакета содержания)
PRIVATE_KEYS = frozenset(
    {
        "correct_option_id",
        "correct_option_ids",
        "correct_answer",
        "accepted_answers",
        "criteria",
        "reference_solution",
        "hint",
        "explanation",
    }
)


@dataclass
class GradeResult:
    passed: bool
    score: Decimal
    feedback: str
    details: dict | None = None


@dataclass(frozen=True)
class Checker:
    kind: str
    # none — засчитывается при прочтении; auto — результат сразу; manual — очередь куратора
    mode: str
    label: str
    default_type: str
    grade: Callable[[dict, dict, Decimal], GradeResult] | None = None
    validate_answers: Callable[[dict], str | None] | None = None
    public: Callable[[dict], dict] | None = None
    extra_private: frozenset[str] = field(default_factory=frozenset)


_REGISTRY: dict[str, Checker] = {}


def register(checker: Checker) -> Checker:
    _REGISTRY[checker.kind] = checker
    return checker


def get(kind: str) -> Checker | None:
    return _REGISTRY.get(kind)


def all_checkers() -> list[Checker]:
    return list(_REGISTRY.values())


def step_type(kind: str, content: dict | None) -> str:
    t = (content or {}).get("type")
    if isinstance(t, str) and t:
        return t
    checker = get(kind)
    return checker.default_type if checker else kind


def public_content(kind: str, content: dict | None) -> dict:
    checker = get(kind)
    hidden = PRIVATE_KEYS | (checker.extra_private if checker else frozenset())
    data = {k: v for k, v in (content or {}).items() if k not in hidden}
    if checker and checker.public:
        data = checker.public(data)
    return data


# ---------- Контрольный вопрос: один / несколько вариантов или короткий ответ ----------


def normalize_answer(value: object) -> str:
    s = str(value if value is not None else "").strip().lower().replace("ё", "е")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"(\d),(\d)", r"\1.\2", s)
    s = s.replace("−", "-")
    try:
        num = Decimal(s)
        return format(num.normalize(), "f") if num == num.to_integral() else str(num.normalize())
    except Exception:  # noqa: BLE001
        return s


def _quiz_mode(content: dict) -> str:
    if content.get("multiple") or isinstance(content.get("correct_option_ids"), list):
        return "multiple"
    if content.get("options"):
        return "single"
    return "answer"


def grade_quiz(content: dict, answers: dict, max_score: Decimal) -> GradeResult:
    mode = _quiz_mode(content)
    if mode == "multiple":
        chosen = answers.get("selected_option_ids")
        correct = {str(x) for x in content.get("correct_option_ids") or []}
        ok = isinstance(chosen, list) and {str(x) for x in chosen} == correct
    elif mode == "single":
        ok = str(answers.get("selected_option_id", "")) == str(content.get("correct_option_id"))
    else:
        accepted = [content.get("correct_answer"), content.get("correct_option_id"), *(content.get("accepted_answers") or [])]
        accepted_norm = {normalize_answer(a) for a in accepted if a not in (None, "")}
        given = answers.get("answer", answers.get("selected_option_id"))
        ok = given not in (None, "") and normalize_answer(given) in accepted_norm

    if ok:
        return GradeResult(True, Decimal(max_score), str(content.get("explanation") or "Верно"))
    feedback = str(content.get("hint") or "")
    if not feedback:
        feedback = "Выбраны не все верные варианты или есть лишний." if mode == "multiple" else "Пока не совпало с ответом."
    return GradeResult(False, Decimal("0"), feedback)


def validate_quiz(answers: dict) -> str | None:
    if answers.get("selected_option_ids") or answers.get("selected_option_id") or str(answers.get("answer", "")).strip():
        return None
    return "Выберите вариант или введите ответ"


def public_quiz(content: dict) -> dict:
    content["mode"] = _quiz_mode(content)
    return content


# ---------- Задача с тестами ----------


def _tests(content: dict) -> list[dict]:
    return [t for t in content.get("tests") or [] if isinstance(t, dict)]


def public_code(content: dict) -> dict:
    tests = _tests(content)
    content["tests"] = [{"input": t.get("input", ""), "output": t.get("output", "")} for t in tests if t.get("sample")]
    content["tests_total"] = len(tests)
    return content


VERDICT_TEXT = {
    "WA": "неверный ответ",
    "TLE": "превышено время",
    "RE": "ошибка во время выполнения",
    "ML": "превышена память",
}


def grade_code(content: dict, answers: dict, max_score: Decimal) -> GradeResult:
    code = str(answers.get("code") or answers.get("text") or "")
    tests = _tests(content)
    language = str(content.get("language") or "python")
    if language != "python":
        return GradeResult(False, Decimal("0"), "Сервер проверяет решения только на Python 3.")
    verdicts = judge.run_tests(
        code,
        tests,
        time_limit_ms=int(content.get("time_limit_ms") or 1000),
        memory_limit_mb=int(content.get("memory_limit_mb") or 256),
    )
    passed = sum(1 for v in verdicts if v.verdict == "OK")
    total = len(verdicts)
    rows = []
    for i, (t, v) in enumerate(zip(tests, verdicts, strict=True), start=1):
        row: dict = {"n": i, "verdict": v.verdict, "time_ms": v.time_ms, "sample": bool(t.get("sample"))}
        if t.get("sample"):
            # Входные данные и ответ показываем только для примеров из условия — скрытые тесты остаются скрытыми
            row.update(input=t.get("input", ""), expected=t.get("output", ""), actual=v.actual[:2000])
        if v.error:
            row["error"] = v.error
        rows.append(row)

    all_ok = total > 0 and passed == total
    if all_ok:
        feedback = f"Все тесты пройдены: {passed} из {total}."
        score = Decimal(max_score)
    else:
        first = next((r for r in rows if r["verdict"] != "OK"), None)
        where = f" Тест {first['n']}: {VERDICT_TEXT.get(first['verdict'], first['verdict'])}." if first else ""
        feedback = f"Прошло {passed} из {total}.{where}"
        score = Decimal("0")
    return GradeResult(all_ok, score, feedback, {"passed": passed, "total": total, "tests": rows})


def validate_code(answers: dict) -> str | None:
    code = str(answers.get("code") or answers.get("text") or "")
    if not code.strip():
        return "Пустое решение"
    if len(code.encode("utf-8")) > judge.MAX_CODE_BYTES:
        return "Решение длиннее 64 КБ"
    return None


# ---------- Ручная проверка ----------


def validate_manual(answers: dict) -> str | None:
    if any(str(answers.get(k) or "").strip() for k in ("text", "link", "screenshot_url")):
        return None
    return "Добавьте ответ, ссылку или скриншот"


register(Checker(kind="theory", mode="none", label="Засчитывается при прочтении", default_type="theory"))
register(
    Checker(
        kind="quiz",
        mode="auto",
        label="Автопроверка ответа",
        default_type="quiz",
        grade=grade_quiz,
        validate_answers=validate_quiz,
        public=public_quiz,
    )
)
register(
    Checker(
        kind="code",
        mode="auto",
        label="Прогон по тестам",
        default_type="algo",
        grade=grade_code,
        validate_answers=validate_code,
        public=public_code,
    )
)
register(
    Checker(
        kind="task",
        mode="manual",
        label="Ручная проверка куратором",
        default_type="project",
        validate_answers=validate_manual,
    )
)
