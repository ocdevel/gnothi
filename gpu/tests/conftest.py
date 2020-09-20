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

@pytest.fixture(scope='module', autouse=True)
def clear_sess(db):
    nlp_.clear()
    db.execute("delete from jobs")
    db.commit()


@pytest.fixture(scope='session')
def entries():
    return fixtures.entries


@pytest.fixture(scope='session')
def users():
    return fixtures.users


@pytest.fixture(scope='session', autouse=True)
def setup_entries(entries, db):
    db.execute("delete from users")
    u = M.User(id=uuid4(), email='user@x.com', hashed_password='xyz')
    db.add(u)
    db.commit()
    for k, v in entries.items():
        db.add(M.Entry(title=k, text=v.text, user_id=u.id))
    db.commit()
    nlp_.entries()
