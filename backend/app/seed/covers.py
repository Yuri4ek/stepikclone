"""Обложки SVG для seed-курсов."""

from __future__ import annotations

from pathlib import Path

from app.core.uploads import COVERS_DIR, ensure_upload_dirs

_COVERS: dict[str, tuple[str, str]] = {
    "python-setup.svg": ("#306998", "Python & PyCharm"),
    "python-first.svg": ("#FFD43B", "Python: старт"),
    "codeolymp.svg": ("#1B4D3E", "CodeOlymp"),
    "algo-intro.svg": ("#5C6BC0", "Алгоритмы"),
}


def _svg(bg: str, title: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="{bg}"/>
  <text x="40" y="240" fill="#ffffff" font-family="Arial,sans-serif" font-size="42" font-weight="700">{title}</text>
</svg>
"""


def write_seed_covers() -> dict[str, str]:
    """Пишет SVG в uploads/covers и возвращает slug→url."""
    ensure_upload_dirs()
    mapping = {
        "python-setup": "python-setup.svg",
        "python-first-steps": "python-first.svg",
        "codeolymp-start": "codeolymp.svg",
        "algo-intro": "algo-intro.svg",
    }
    urls: dict[str, str] = {}
    for slug, filename in mapping.items():
        bg, title = _COVERS[filename]
        path = COVERS_DIR / filename
        path.write_text(_svg(bg, title), encoding="utf-8")
        urls[slug] = f"/uploads/covers/{filename}"
    return urls
