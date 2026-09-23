from pathlib import Path

from app.core.config import get_settings

settings = get_settings()

# корень загрузок относительно cwd при запуске uvicorn из backend/
UPLOAD_ROOT = Path(settings.upload_dir).resolve()
COVERS_DIR = UPLOAD_ROOT / "covers"
STEPS_DIR = UPLOAD_ROOT / "steps"


def ensure_upload_dirs() -> None:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    STEPS_DIR.mkdir(parents=True, exist_ok=True)
