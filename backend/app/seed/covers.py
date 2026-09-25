"""Обложки курсов: копируем реальные фото из seed/assets в uploads/covers."""

from __future__ import annotations

import shutil
from pathlib import Path

from app.core.uploads import COVERS_DIR, ensure_upload_dirs

ASSETS = Path(__file__).resolve().parent / "assets"


_COVER_FILES: dict[str, str] = {
    "python-setup": "cover-edu.png",
    "python-first-steps": "cover-table.jpg",
    "codeolymp-start": "cover-edu.png",
    "algo-intro": "cover-table.jpg",
    "minecraft-agent": "cover-edu.png",
}


def write_seed_covers() -> dict[str, str]:
    ensure_upload_dirs()
    urls: dict[str, str] = {}
    for slug, filename in _COVER_FILES.items():
        src = ASSETS / filename
        if not src.is_file():
            raise FileNotFoundError(f"Seed cover missing: {src}")
        dest = COVERS_DIR / filename
        shutil.copy2(src, dest)
        urls[slug] = f"/uploads/covers/{filename}"
    return urls
