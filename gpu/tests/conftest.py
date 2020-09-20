import os
os.environ['ENVIRONMENT'] = 'testing'

import pytest, pdb
from uuid import uuid4
from app.nlp import nlp_
from common.fixtures import fixtures
import common.database as D
import common.models as M

@pytest.fixture(scope='session')
def db():
    with D.session() as sess:
        yield sess

@pytest.fixture(scope='session')
def entries():
    return fixtures.entries


@pytest.fixture(scope='session')
def users():
    return fixtures.users

@pytest.fixture(scope='module', autouse=True)
def clear_sess(db):
    nlp_.clear()
    db.execute("delete from jobs")
    db.commit()


@pytest.fixture(scope='module')
def main_uid(db):
    db.execute("delete from users")
    db.commit()
    for k in ['entries', 'cache_entries']:
        sql = f"select count(*) as ct from {k}"
        assert db.execute(sql).fetchone().ct == 0
    u = M.User(id=uuid4(), **fixtures.users.user)
    db.add(u)
    db.commit()
    return u.id

@pytest.fixture(scope='module', autouse=True)
def setup_entries(entries, db, main_uid):
    for k, v in entries.items():
        db.add(M.Entry(title=k, text=v.text, user_id=main_uid))
    db.commit()
    nlp_.entries()
