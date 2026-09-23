"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-09-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role = postgresql.ENUM("student", "curator", "admin", name="user_role", create_type=False)
course_status = postgresql.ENUM("draft", "published", name="course_status", create_type=False)
step_kind = postgresql.ENUM("theory", "quiz", "task", "code", name="step_kind", create_type=False)
enrollment_status = postgresql.ENUM("active", "completed", name="enrollment_status", create_type=False)
step_progress_status = postgresql.ENUM(
    "locked",
    "available",
    "in_progress",
    "submitted",
    "returned",
    "passed",
    "failed",
    name="step_progress_status",
    create_type=False,
)
check_type = postgresql.ENUM("auto", "manual", name="check_type", create_type=False)
submission_status = postgresql.ENUM("pending", "graded", "returned", name="submission_status", create_type=False)


def upgrade() -> None:
    op.execute("CREATE TYPE user_role AS ENUM ('student', 'curator', 'admin')")
    op.execute("CREATE TYPE course_status AS ENUM ('draft', 'published')")
    op.execute("CREATE TYPE step_kind AS ENUM ('theory', 'quiz', 'task', 'code')")
    op.execute("CREATE TYPE enrollment_status AS ENUM ('active', 'completed')")
    op.execute(
        "CREATE TYPE step_progress_status AS ENUM "
        "('locked', 'available', 'in_progress', 'submitted', 'returned', 'passed', 'failed')"
    )
    op.execute("CREATE TYPE check_type AS ENUM ('auto', 'manual')")
    op.execute("CREATE TYPE submission_status AS ENUM ('pending', 'graded', 'returned')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", course_status, nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)

    op.create_table(
        "modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
    )

    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("modules.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
    )

    op.create_table(
        "steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("kind", step_kind, nullable=False),
        sa.Column("content", postgresql.JSONB(), nullable=False),
        sa.Column("max_score", sa.Numeric(8, 2), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
    )

    op.create_table(
        "course_curators",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.UniqueConstraint("course_id", "user_id", name="uq_course_curator"),
    )

    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE")),
        sa.Column("status", enrollment_status, nullable=False),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),
    )

    op.create_table(
        "step_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("step_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("steps.id", ondelete="CASCADE")),
        sa.Column("status", step_progress_status, nullable=False),
        sa.Column("score", sa.Numeric(8, 2), nullable=True),
        sa.Column("best_score", sa.Numeric(8, 2), nullable=True),
        sa.Column("attempts_count", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "step_id", name="uq_step_progress_user_step"),
    )

    op.create_table(
        "course_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "enrollment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("enrollments.id", ondelete="CASCADE"),
            unique=True,
        ),
        sa.Column("completed_steps", sa.Integer(), nullable=False),
        sa.Column("total_required_steps", sa.Integer(), nullable=False),
        sa.Column("percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("current_step_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("steps.id"), nullable=True),
        sa.Column("rating_score", sa.Numeric(8, 2), nullable=False),
        sa.Column("rating_breakdown", postgresql.JSONB(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("step_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("steps.id", ondelete="CASCADE")),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("check_type", check_type, nullable=False),
        sa.Column("status", submission_status, nullable=False),
        sa.Column("score", sa.Numeric(8, 2), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("submissions")
    op.drop_table("course_progress")
    op.drop_table("step_progress")
    op.drop_table("enrollments")
    op.drop_table("course_curators")
    op.drop_table("steps")
    op.drop_table("lessons")
    op.drop_table("modules")
    op.drop_table("courses")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS submission_status")
    op.execute("DROP TYPE IF EXISTS check_type")
    op.execute("DROP TYPE IF EXISTS step_progress_status")
    op.execute("DROP TYPE IF EXISTS enrollment_status")
    op.execute("DROP TYPE IF EXISTS step_kind")
    op.execute("DROP TYPE IF EXISTS course_status")
    op.execute("DROP TYPE IF EXISTS user_role")
