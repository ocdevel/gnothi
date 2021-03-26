"""groups_init

Revision ID: a30a10eb8528
Revises: 
Create Date: 2021-03-26 19:04:10.477286

"""
import pdb
from alembic import op, context
import sqlalchemy as sa
import sqlalchemy.orm as orm
from sqlalchemy.dialects import postgresql
from sqlalchemy_utils.types.encrypted.encrypted_type import StringEncryptedType, FernetEngine
from common.database import Base
import common.models as M

# revision identifiers, used by Alembic.
revision = 'a30a10eb8528'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    Base.metadata.create_all(bind=bind)
    bind.execute(f"""
        insert into auth_old (id, email, hashed_password)
        select id, email, hashed_password from users;
    """)

    session.add(M.Group(
        id='ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035',
        owner=session.execute("select id from users where email='tylerrenelle@gmail.com'").first().id,
        title='Gnothi',
        text='Main Gnothi group. Basically a global chatroom, see topical groups on the right',
        privacy=M.GroupPrivacy.public
    ))
    session.commit()

    op.add_column('users', sa.Column('cognito_id', sa.Unicode(), nullable=True))
    op.add_column('users', sa.Column('username', sa.Unicode(), nullable=True))
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'hashed_password')
    op.create_index(op.f('ix_users_cognito_id'), 'users', ['cognito_id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)

    op.drop_table('profile_matches')
    op.add_column('jobs', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'jobs', 'users', ['user_id'], ['id'], ondelete='cascade')




def downgrade():
    pass
