from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.uploads import UPLOAD_ROOT, ensure_upload_dirs
from app.slices.auth.router import router as auth_router
from app.slices.catalog.router import router as catalog_router
from app.slices.course_builder.router import router as admin_router
from app.slices.lag.router import router as lag_router
from app.slices.learning.router import router as learning_router
from app.slices.progress.router import router as progress_router
from app.slices.questions.router import router as questions_router
from app.slices.reviews.router import router as reviews_router

settings = get_settings()
ensure_upload_dirs()

app = FastAPI(title="КодСтарт API", version="0.2.0")
if settings.cors_allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["course_builder"])
app.include_router(catalog_router, prefix="/api/v1/catalog", tags=["catalog"])
app.include_router(learning_router, prefix="/api/v1/learning", tags=["learning"])
app.include_router(reviews_router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(progress_router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(lag_router, prefix="/api/v1/lag", tags=["lag"])
app.include_router(questions_router, prefix="/api/v1/questions", tags=["questions"])

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
