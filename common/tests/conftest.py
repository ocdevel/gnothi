import os
os.environ['ENVIRONMENT'] = 'testing'

from common.utils import vars
assert 'gnothi_test' in vars.DB_FULL, "not using test DB!"

from sqlalchemy_utils import database_exists, drop_database, create_database
# Don't drop db! need some tables to stick around, like books. Will drop tables below
if database_exists(vars.DB_FULL):
    drop_database(vars.DB_FULL)
create_database(vars.DB_FULL)


import pytest, time
from box import Box
import common.database as D
import common.models as M

import logging
logger = logging.getLogger(__name__)


@pytest.fixture(scope='session')
def db():
    D.init_db()
    with D.with_db() as db:
        yield db


@pytest.fixture()
def u(db):
    db.execute("delete from users;")
    db.commit()
    u = Box({
        f"user{k}": M.User(email=f"{k}@x.com", first_name=f"first_name_{k}")
        for k in range(1, 6)
    })
    db.add_all([v for k, v in u.items()])
    db.commit()
    for k, v in u.items():
        db.refresh(v)
    return u
