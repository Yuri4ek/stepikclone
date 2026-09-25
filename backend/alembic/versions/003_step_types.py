"""extensible step kinds, course passport, auto-check result, step questions

Revision ID: 003_step_types
Revises: 002_cover
Create Date: 2026-09-25
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_step_types"
down_revision: Union[str, None] = "002_cover"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

question_status = postgresql.ENUM("open", "answered", name="question_status", create_type=False)


def upgrade() -> None:
    # kind — строка: механизм проверки берётся из реестра в коде, новый не требует ALTER TYPE
    op.execute("ALTER TABLE steps ALTER COLUMN kind TYPE varchar(32) USING kind::text")
    op.execute("DROP TYPE IF EXISTS step_kind")

    op.add_column(
        "courses",
        sa.Column("passport", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.add_column("submissions", sa.Column("result", postgresql.JSONB(), nullable=True))

    op.execute("CREATE TYPE question_status AS ENUM ('open', 'answered')")
    op.create_table(
        "step_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("step_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("steps.id", ondelete="CASCADE")),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", question_status, nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("answered_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_step_questions_step_id", "step_questions", ["step_id"])
    op.create_index("ix_step_questions_course_id", "step_questions", ["course_id"])
    op.create_index("ix_step_questions_user_id", "step_questions", ["user_id"])
    op.create_index("ix_submissions_user_step", "submissions", ["user_id", "step_id"])
    op.create_index("ix_step_progress_user", "step_progress", ["user_id"])

    # Удаление шага, который у кого-то текущий, раньше падало на внешнем ключе
    op.drop_constraint("course_progress_current_step_id_fkey", "course_progress", type_="foreignkey")
    op.create_foreign_key(
        "course_progress_current_step_id_fkey",
        "course_progress",
        "steps",
        ["current_step_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("course_progress_current_step_id_fkey", "course_progress", type_="foreignkey")
    op.create_foreign_key(
        "course_progress_current_step_id_fkey", "course_progress", "steps", ["current_step_id"], ["id"]
    )
    op.drop_index("ix_step_progress_user", table_name="step_progress")
    op.drop_index("ix_submissions_user_step", table_name="submissions")
    op.drop_table("step_questions")
    op.execute("DROP TYPE IF EXISTS question_status")
    op.drop_column("submissions", "result")
    op.drop_column("courses", "passport")
    op.execute("CREATE TYPE step_kind AS ENUM ('theory', 'quiz', 'task', 'code')")
    op.execute("ALTER TABLE steps ALTER COLUMN kind TYPE step_kind USING kind::step_kind")
