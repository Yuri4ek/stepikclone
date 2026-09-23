"""Контент демо-курсов (кратко, в духе Stepik / олимпиадного трека)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.models.course import StepKind


def _theory(markdown: str, images: list[dict] | None = None) -> dict:
    data: dict[str, Any] = {"markdown": markdown}
    if images:
        data["images"] = images
    return data


def _quiz(question: str, options: list[dict], correct: str) -> dict:
    return {"question": question, "options": options, "correct_option_id": correct}


def _task(markdown: str, criteria: str) -> dict:
    return {"markdown": markdown, "criteria": criteria}


def course_specs(cover_urls: dict[str, str]) -> list[dict]:
    """Список курсов: метаданные + дерево modules/lessons/steps."""
    return [
        {
            "slug": "python-setup",
            "title": "Python и PyCharm: установка",
            "description": (
                "Как скачать Python, проверить установку и настроить PyCharm. "
                "Короткий старт перед программированием (в духе вводных уроков Stepik)."
            ),
            "cover_url": cover_urls["python-setup"],
            "modules": [
                {
                    "title": "Модуль 1. Python",
                    "position": 1,
                    "lessons": [
                        {
                            "title": "Установка Python",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: откуда скачать Python",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Установка Python\n\n"
                                        "1. Откройте [python.org/downloads](https://www.python.org/downloads/).\n"
                                        "2. Скачайте установщик для вашей ОС.\n"
                                        "3. На Windows отметьте **Add Python to PATH**.\n"
                                        "4. В терминале выполните `python --version` или `python3 --version`.\n\n"
                                        "Нужна версия **3.10+**.",
                                        images=[{"url": cover_urls["python-setup"], "alt": "Minecraft Education — обучение"}],
                                    ),
                                },
                                {
                                    "title": "Квиз: проверка установки",
                                    "position": 2,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        "Какая команда обычно показывает версию Python?",
                                        [
                                            {"id": "a", "text": "python --version"},
                                            {"id": "b", "text": "python install"},
                                            {"id": "c", "text": "pip update all"},
                                        ],
                                        "a",
                                    ),
                                },
                            ],
                        }
                    ],
                },
                {
                    "title": "Модуль 2. PyCharm",
                    "position": 2,
                    "lessons": [
                        {
                            "title": "Установка PyCharm",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: PyCharm Community",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# PyCharm\n\n"
                                        "1. Скачайте **PyCharm Community** с сайта JetBrains.\n"
                                        "2. Создайте проект (New Project) и укажите интерпретатор Python.\n"
                                        "3. Создайте файл `main.py` и напишите `print(\"Hello\")`.\n"
                                        "4. Запустите файл (Run).\n\n"
                                        "Альтернативы: VS Code + расширение Python, Cursor.",
                                        images=[{"url": cover_urls["python-setup"], "alt": "Среда обучения"}],
                                    ),
                                },
                                {
                                    "title": "Задача: опишите свою установку",
                                    "position": 2,
                                    "kind": StepKind.task,
                                    "max_score": Decimal("15"),
                                    "content": _task(
                                        "Кратко напишите: какая у вас ОС, версия Python и чем вы пользуетесь "
                                        "(PyCharm / VS Code / другое). Приложите вывод `python --version`.",
                                        "Указаны ОС, версия Python и среда разработки",
                                    ),
                                },
                            ],
                        }
                    ],
                },
            ],
        },
        {
            "slug": "python-first-steps",
            "title": "Python: первые шаги",
            "description": (
                "print, переменные и ввод — короткие шаги как во вводных курсах Stepik «Программирование на Python»."
            ),
            "cover_url": cover_urls["python-first-steps"],
            "modules": [
                {
                    "title": "Модуль 1. Вывод и переменные",
                    "position": 1,
                    "lessons": [
                        {
                            "title": "print и переменные",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: print",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Функция print\n\n"
                                        "```python\nprint(\"Привет, мир!\")\nprint(2 + 2)\n```\n\n"
                                        "Аргументы через запятую разделяются пробелом:\n"
                                        "```python\nprint(\"x =\", 5)\n```"
                                    ),
                                },
                                {
                                    "title": "Квиз: что выведет код",
                                    "position": 2,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        'Что выведет `print(2 * 3)`?',
                                        [
                                            {"id": "a", "text": "6"},
                                            {"id": "b", "text": "23"},
                                            {"id": "c", "text": "2 * 3"},
                                        ],
                                        "a",
                                    ),
                                },
                                {
                                    "title": "Теория: переменные",
                                    "position": 3,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Переменные\n\n"
                                        "```python\nname = \"Анна\"\nage = 14\nprint(name, age)\n```\n\n"
                                        "Имя переменной: буквы, цифры, `_`; не начинается с цифры."
                                    ),
                                },
                                {
                                    "title": "Квиз: имена переменных",
                                    "position": 4,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        "Какое имя переменной корректно в Python?",
                                        [
                                            {"id": "a", "text": "2value"},
                                            {"id": "b", "text": "user_name"},
                                            {"id": "c", "text": "user-name"},
                                        ],
                                        "b",
                                    ),
                                },
                            ],
                        }
                    ],
                },
                {
                    "title": "Модуль 2. Ввод",
                    "position": 2,
                    "lessons": [
                        {
                            "title": "input",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: input",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Ввод с клавиатуры\n\n"
                                        "```python\nname = input()\nprint(\"Привет,\", name)\n```\n\n"
                                        "`input()` всегда возвращает **строку**. Число: `int(input())`."
                                    ),
                                },
                                {
                                    "title": "Задача: программа приветствия",
                                    "position": 2,
                                    "kind": StepKind.task,
                                    "max_score": Decimal("20"),
                                    "content": _task(
                                        "Напишите программу: читает имя и печатает `Привет, <имя>!`. "
                                        "Пришлите код текстом.",
                                        "Есть input и корректный print с именем",
                                    ),
                                },
                            ],
                        }
                    ],
                },
            ],
        },
        {
            "slug": "codeolymp-start",
            "title": "Олимпиадное программирование: старт",
            "description": (
                "Ввод-вывод, условия и циклы — база для школьных олимпиад "
                "(формат близкий к вводным трекам Codeolymp / олимпиадному Python)."
            ),
            "cover_url": cover_urls["codeolymp-start"],
            "modules": [
                {
                    "title": "Модуль 1. Ввод-вывод на олимпиаде",
                    "position": 1,
                    "lessons": [
                        {
                            "title": "Читаем данные",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: типичный ввод",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Олимпиадный ввод\n\n"
                                        "Часто числа в одной строке:\n"
                                        "```python\na, b = map(int, input().split())\nprint(a + b)\n```\n\n"
                                        "Не печатайте лишнего текста — только ответ."
                                    ),
                                },
                                {
                                    "title": "Квиз: map + split",
                                    "position": 2,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        "Для ввода `3 5` что делает `a, b = map(int, input().split())`?",
                                        [
                                            {"id": "a", "text": "a=3, b=5 (числа)"},
                                            {"id": "b", "text": "a='3', b='5' (строки)"},
                                            {"id": "c", "text": "ошибка всегда"},
                                        ],
                                        "a",
                                    ),
                                },
                                {
                                    "title": "Задача: A+B",
                                    "position": 3,
                                    "kind": StepKind.task,
                                    "max_score": Decimal("20"),
                                    "content": _task(
                                        "Задача A+B: на вход два целых числа, на выход их сумма. Пришлите код.",
                                        "Корректный ввод двух чисел и вывод суммы",
                                    ),
                                },
                            ],
                        }
                    ],
                },
                {
                    "title": "Модуль 2. Условия",
                    "position": 2,
                    "lessons": [
                        {
                            "title": "if / else",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: условия",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Условия\n\n"
                                        "```python\nn = int(input())\nif n % 2 == 0:\n    print(\"even\")\nelse:\n    print(\"odd\")\n```"
                                    ),
                                },
                                {
                                    "title": "Квиз: чётность",
                                    "position": 2,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        "Какое условие проверяет чётность n?",
                                        [
                                            {"id": "a", "text": "n % 2 == 0"},
                                            {"id": "b", "text": "n / 2 == 0"},
                                            {"id": "c", "text": "n == even"},
                                        ],
                                        "a",
                                    ),
                                },
                            ],
                        }
                    ],
                },
            ],
        },
        {
            "slug": "algo-intro",
            "title": "Алгоритмы: знакомство",
            "description": "Сложность, перебор и простые идеи — короткий обзор перед олимпиадными задачами.",
            "cover_url": cover_urls["algo-intro"],
            "modules": [
                {
                    "title": "Модуль 1. Что такое алгоритм",
                    "position": 1,
                    "lessons": [
                        {
                            "title": "Идеи и сложность",
                            "position": 1,
                            "steps": [
                                {
                                    "title": "Теория: алгоритм",
                                    "position": 1,
                                    "kind": StepKind.theory,
                                    "max_score": Decimal("0"),
                                    "content": _theory(
                                        "# Алгоритм\n\n"
                                        "Алгоритм — конечная последовательность шагов для решения задачи.\n\n"
                                        "На олимпиадах важны:\n"
                                        "- правильность;\n"
                                        "- скорость (часто O(n) или O(n log n));\n"
                                        "- аккуратный ввод-вывод.",
                                        images=[{"url": cover_urls["algo-intro"], "alt": "Таблица элементов в Minecraft"}],
                                    ),
                                },
                                {
                                    "title": "Квиз: зачем нужна сложность",
                                    "position": 2,
                                    "kind": StepKind.quiz,
                                    "max_score": Decimal("10"),
                                    "content": _quiz(
                                        "Почему важна оценка сложности?",
                                        [
                                            {"id": "a", "text": "Чтобы понять, уложится ли решение во время"},
                                            {"id": "b", "text": "Чтобы код был красивее"},
                                            {"id": "c", "text": "Она не нужна"},
                                        ],
                                        "a",
                                    ),
                                },
                                {
                                    "title": "Задача: опишите алгоритм",
                                    "position": 3,
                                    "kind": StepKind.task,
                                    "max_score": Decimal("15"),
                                    "content": _task(
                                        "Опишите словами алгоритм поиска максимума в списке чисел "
                                        "(без кода или с коротким псевдокодом).",
                                        "Есть понятные шаги: обход и сравнение",
                                    ),
                                },
                            ],
                        }
                    ],
                }
            ],
        },
    ]
