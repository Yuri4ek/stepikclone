import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

settings = get_settings()

# корень загрузок относительно cwd при запуске uvicorn из backend/
UPLOAD_ROOT = Path(settings.upload_dir).resolve()
COVERS_DIR = UPLOAD_ROOT / "covers"
STEPS_DIR = UPLOAD_ROOT / "steps"
# Скриншоты и файлы, которые сдают ученики
SUBMISSIONS_DIR = UPLOAD_ROOT / "submissions"


def ensure_upload_dirs() -> None:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    STEPS_DIR.mkdir(parents=True, exist_ok=True)
    SUBMISSIONS_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
MAX_BYTES = 5 * 1024 * 1024


async def save_image(file: UploadFile, directory: Path) -> str:
    ensure_upload_dirs()
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only jpeg/png/webp/gif")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 5MB)")
    name = f"{uuid.uuid4().hex}{ALLOWED_TYPES[content_type]}"
    path = directory / name
    path.write_bytes(data)
    # публичный URL относительно API-хоста
    rel = directory.name
    return f"/uploads/{rel}/{name}"
