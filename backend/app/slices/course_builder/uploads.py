from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.uploads import COVERS_DIR, STEPS_DIR, ensure_upload_dirs
from app.models.course import Course
from app.models.user import User, UserRole

router = APIRouter()
admin_dep = require_roles(UserRole.admin)

ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
MAX_BYTES = 5 * 1024 * 1024


async def _save_image(file: UploadFile, directory: Path) -> str:
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


@router.post("/uploads/images", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(admin_dep),
) -> dict:
    """Универсальная загрузка картинки для шагов/контента."""
    url = await _save_image(file, STEPS_DIR)
    return {"url": url}


@router.post("/courses/{course_id}/cover", status_code=200)
async def upload_course_cover(
    course_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(admin_dep),
) -> dict:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    url = await _save_image(file, COVERS_DIR)
    course.cover_url = url
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"id": course.id, "cover_url": course.cover_url}
