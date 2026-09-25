import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CheckType(str, enum.Enum):
    auto = "auto"
    manual = "manual"


class SubmissionStatus(str, enum.Enum):
    pending = "pending"
    graded = "graded"
    returned = "returned"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    step_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    check_type: Mapped[CheckType] = mapped_column(Enum(CheckType, name="check_type"), nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status"), default=SubmissionStatus.pending, nullable=False
    )
    score: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Подробности автопроверки: вердикты по тестам и т. п.
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
