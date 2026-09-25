import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.slices.progress import service
from app.slices.progress.schemas import LeaderboardOut, ProgressOut

router = APIRouter()


@router.get("/courses/{course_id}", response_model=ProgressOut)
def get_course_progress(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProgressOut:
    enrollment = service.get_enrollment(db, user.id, course_id)
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")

    cp = service.recalculate(db, enrollment)
    db.commit()
    board = service.leaderboard(db, course_id, user.id, top=0)
    return ProgressOut(
        course_id=course_id,
        enrollment_id=enrollment.id,
        percent=cp.percent,
        completed_required_steps=cp.completed_steps,
        total_required_steps=cp.total_required_steps,
        current_step_id=cp.current_step_id,
        rating={
            "score": float(cp.rating_score),
            "total_score": cp.rating_breakdown.get("total_score", 0),
            "total_max": cp.rating_breakdown.get("total_max", 0),
            "pending_max": cp.rating_breakdown.get("pending_max", 0),
            "formula": cp.rating_breakdown.get("formula"),
            "breakdown": cp.rating_breakdown.get("steps", []),
            "place": board["place"],
            "group_size": board["group_size"],
        },

        streak_days=service.streak(service.activity_days(db, user.id)),
        updated_at=cp.updated_at,
    )


@router.get("/courses/{course_id}/leaderboard", response_model=LeaderboardOut)
def get_leaderboard(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LeaderboardOut:
    if service.get_enrollment(db, user.id, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not enrolled")
    return LeaderboardOut(course_id=course_id, **service.leaderboard(db, course_id, user.id))
