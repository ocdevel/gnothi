import os
os.environ['ENVIRONMENT'] = 'testing'
from common.utils import vars
assert vars.DB_FULL.endswith('_test')

import pytest, pdb
from uuid import uuid4
from app.nlp import nlp_
from common.fixtures import fixtures
import common.database as D
import common.models as M
import app.entries_profiles as e_p

with D.session() as sess:
    # drop & re-create since we'll be futzing with models/fields
    for t in 'users cache_users entries cache_entries'.split():
        sess.execute(f"drop table if exists {t} cascade")
    sess.commit()
D.init_db()

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
    for k in 'entries cache_entries cache_users'.split():
        sql = f"select count(*) as ct from {k}"
        assert db.execute(sql).fetchone().ct == 0
    u = M.User(id=uuid4(), **fixtures.users.user)
    db.add(u)
    db.commit()
    return str(u.id)


@pytest.fixture(scope='module', autouse=True)
def setup_entries(entries, db, main_uid):
    # main_uid "delete from users" deletes prior entries
    for k, v in entries.items():
        db.add(M.Entry(title=k, text=v.text, user_id=main_uid))
    db.commit()
    e_p.entries()
