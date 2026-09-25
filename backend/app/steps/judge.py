"""Прогон решения по тестам (Python 3).

Каждый тест — отдельный процесс с лимитами CPU, памяти и размера вывода; в контейнере — от пользователя judge
без доступа к коду и настройкам бэкенда. Сети и файловой системы целиком это не закрывает: в продакшене прогон
стоит вынести в отдельный изолированный воркер (nsjail / gVisor / отдельный контейнер без сети).
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import threading
import time
from dataclasses import dataclass

MAX_CODE_BYTES = 64 * 1024
MAX_OUTPUT_BYTES = 1024 * 1024
# Одновременно гоняем не больше N решений, чтобы стенд не лёг от наплыва отправок
_slots = threading.BoundedSemaphore(int(os.environ.get("JUDGE_CONCURRENCY", "4")))


@dataclass
class TestVerdict:
    verdict: str  # OK | WA | TLE | RE | ML
    time_ms: int
    actual: str
    error: str | None


def _judge_ids() -> tuple[int, int] | None:
    """Если сервер запущен от root (контейнер), решения запускаем от непривилегированного пользователя judge:
    ему недоступны файлы бэкенда (Dockerfile снимает с /backend права для «прочих»)."""
    if os.name != "posix" or os.geteuid() != 0:
        return None
    try:
        import pwd

        pw = pwd.getpwnam(os.environ.get("JUDGE_USER", "judge"))
        return pw.pw_uid, pw.pw_gid
    except KeyError:
        return None


_IDS = _judge_ids()


def _limits(cpu_seconds: int, memory_mb: int):
    def apply() -> None:
        if _IDS:
            # Без сброса прав прогон небезопасен — пусть лучше упадёт, чем выполнится от root
            os.setgroups([])
            os.setgid(_IDS[1])
            os.setuid(_IDS[0])
        try:
            import resource

            resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
            resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_OUTPUT_BYTES, MAX_OUTPUT_BYTES))
            # RLIMIT_AS работает на Linux; на macOS setrlimit может отказать — тогда без лимита памяти
            limit = (memory_mb + 64) * 1024 * 1024
            try:
                resource.setrlimit(resource.RLIMIT_AS, (limit, limit))
            except (ValueError, OSError):
                pass
            os.setsid()
        except Exception:  # noqa: BLE001 — лимиты best effort, прогон всё равно ограничен таймаутом
            pass

    return apply


def outputs_match(actual: str, expected: str) -> bool:
    """Сравнение по токенам: лишние пробелы и перевод строки в конце не считаются ошибкой."""
    return actual.split() == expected.split()


def _last_error_line(stderr: str) -> str:
    lines = [ln for ln in stderr.strip().splitlines() if ln.strip()]
    return lines[-1][:300] if lines else "Программа завершилась с ошибкой"


def run_tests(code: str, tests: list[dict], time_limit_ms: int = 1000, memory_limit_mb: int = 256) -> list[TestVerdict]:
    wall = time_limit_ms / 1000 * 2 + 0.5
    cpu = max(1, -(-time_limit_ms // 1000))  # ceil
    verdicts: list[TestVerdict] = []
    timeouts = 0
    with _slots, tempfile.TemporaryDirectory(prefix="judge-") as tmp:
        path = os.path.join(tmp, "solution.py")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
        if _IDS:
            os.chmod(tmp, 0o755)
            os.chmod(path, 0o644)
        env = {"PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1", "PATH": "/usr/bin:/bin"}
        for test in tests:
            if timeouts >= 2:
                # Два превышения времени подряд — остальные тесты не гоняем, результат уже ясен
                verdicts.append(TestVerdict("TLE", 0, "", "Тест пропущен: решение слишком медленное"))
                continue
            started = time.perf_counter()
            try:
                proc = subprocess.run(
                    [sys.executable, "-I", "-S", path],
                    input=str(test.get("input", "")),
                    capture_output=True,
                    text=True,
                    timeout=wall,
                    cwd=tmp,
                    env=env,
                    preexec_fn=_limits(cpu, memory_limit_mb) if os.name == "posix" else None,
                )
            except subprocess.TimeoutExpired:
                timeouts += 1
                verdicts.append(TestVerdict("TLE", int(wall * 1000), "", None))
                continue
            elapsed = int((time.perf_counter() - started) * 1000)
            out = proc.stdout[:MAX_OUTPUT_BYTES]
            if proc.returncode != 0:
                if "MemoryError" in proc.stderr:
                    verdicts.append(TestVerdict("ML", elapsed, out, "Превышен лимит памяти"))
                elif proc.returncode < 0 and elapsed >= time_limit_ms:
                    timeouts += 1
                    verdicts.append(TestVerdict("TLE", elapsed, out, None))
                else:
                    verdicts.append(TestVerdict("RE", elapsed, out, _last_error_line(proc.stderr)))
                continue
            if elapsed > time_limit_ms * 1.5 + 300:
                timeouts += 1
                verdicts.append(TestVerdict("TLE", elapsed, out, None))
                continue
            ok = outputs_match(out, str(test.get("output", "")))
            verdicts.append(TestVerdict("OK" if ok else "WA", elapsed, out, None))
    return verdicts
