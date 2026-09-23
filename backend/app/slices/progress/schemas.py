from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ProgressOut(BaseModel):
    course_id: uuid.UUID
    enrollment_id: uuid.UUID
    percent: Decimal
    completed_required_steps: int
    total_required_steps: int
    current_step_id: uuid.UUID | None
    rating: dict
    updated_at: datetime | None = None
