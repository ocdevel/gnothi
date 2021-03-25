import datetime, pdb
from common.database import init_db, with_db
import common.models as M
import sqlalchemy as sa


def migrate_before(engine):
    M.AuthOld.__table__.create(engine)
    engine.execute(f"""
    insert into auth_old (id, email, hashed_password)
    select id, email, hashed_password from users;
    alter table users drop column hashed_password;
    alter table users drop column is_active;
    --alter table users drop column is_superuser;
    """)
    engine.commit()


def migrate_after(engine):
    pass
