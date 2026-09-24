"""agregar columna dni_extraido

Revision ID: 4645ae80d9ee
Revises: 415e015ac848
Create Date: 2026-09-24 18:43:00.469411

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '4645ae80d9ee'
down_revision: Union[str, Sequence[str], None] = '415e015ac848'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('documentos_identidad', sa.Column('dni_extraido', sqlmodel.sql.sqltypes.AutoString(length=8), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('documentos_identidad', 'dni_extraido')
