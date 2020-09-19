import os, time
os.environ['DB_NAME'] = 'gnothi_test'
os.environ['ENVIRONMENT'] = 'development'  # testing

from common.utils import vars
assert 'gnothi_test' in vars.DB_URL, "not using test DB!"
from sqlalchemy_utils import database_exists, drop_database, create_database
if database_exists(vars.DB_URL):
    drop_database(vars.DB_URL)
if not database_exists(vars.DB_URL):
    create_database(vars.DB_URL)

import pytest, time
from box import Box
from fastapi.testclient import TestClient
from lorem_text import lorem

import common.database as D
import common.models as M
from app.main import app

import logging
logger = logging.getLogger(__name__)


# I want many of these to be session-scope, not just for per but to ensure
# things like Session() gets recycled properly during a full FastAPI session
@pytest.fixture(scope='session')
def client():
    with TestClient(app) as c:
        yield c


@pytest.mark.timeout(5)
@pytest.fixture(scope='session')
def db(client):
    """await client to init_db"""
    with D.session() as sess:
        # Cold-start BERT for downstream
        M.Job.create_job(method='summarization', data_in=dict(args=[['summarize me please']]))

        # wait for GPU to restart from no-db crash
        while True:
            sql = "select 1 from jobs_status where status='on'"
            if M.await_row(sess, sql): break
            time.sleep(.5)

        yield sess


@pytest.fixture(scope='session')
def db_books():
    with D.session('books') as sess:
        yield sess


@pytest.fixture()
def u(client, db):
    # Friend only used to double-check sharing features
    u_ = Box(user={}, therapist={}, friend={}, other={})

    # TODO move delete-cascade testing out to test_users.py
    logger.warning("deleting")
    db.execute("delete from users;delete from jobs;")
    db.commit()
    for t in 'bookshelf entries entries_tags field_entries fields notes people shares shares_tags tags users'.split():
        assert db.execute(f"select count(*) ct from {t}").fetchone().ct == 0, \
            "{t} rows remained after 'delete * from users', check cascade-delete on children"

    logger.warning("creating users")
    for k, _ in u_.items():
        email = k + "@x.com"
        u_[k] = {'email': email}
        form = {'email': email, 'password': email}
        res = client.post("/auth/register", json=form)
        assert res.status_code == 201

        form = {'username': email, 'password': email}
        res = client.post("/auth/jwt/login", data=form)
        assert res.status_code == 200
        token = res.json()['access_token']
        u_[k]['token'] = token
        u_[k]['header'] = {"headers": {"Authorization": f"Bearer {token}"}}

        res = client.get("/user", **u_[k].header)
        assert res.status_code == 200
        u_[k]['id'] = res.json()['id']

        res = client.get("/tags", **u_[k].header)
        assert res.status_code == 200
        u_[k]['tag1'] = {res.json()[0]['id']: True}

    logger.warning("jobs-status")
    # init jobs-status table
    res = client.get('/jobs-status', **u_.user.header)
    assert res.status_code == 200
    assert res.json() == 'on'

    logger.warning("sharing")
    # share user main tag with therapist
    data = dict(email=u_.therapist.email, tags=u_.user.tag1)
    res = client.post('/shares', json=data, **u_.user.header)
    assert res.status_code == 200

    # share user secondary tag with friend
    res = client.post("/tags", json={'name': 'Fun'}, **u_.user.header)
    assert res.status_code == 200
    u_.user['tag2'] = {res.json()['id']: True}
    data = dict(email=u_.friend.email, tags=u_.user.tag2)
    res = client.post('/shares', json=data, **u_.user.header)
    assert res.status_code == 200
    return u_


@pytest.mark.timeout(120)
@pytest.fixture()
def post_entry(client, u, db):
    def _post_entry(**kwargs):
        data = {**dict(
            title='Title',
            text=lorem.paragraphs(3),
            no_ai=True,
            tags=u.user.tag1,
        ), **kwargs}
        res = client.post("/entries", json=data, **u.user.header)
        assert res.status_code == 200
        eid = res.json()['id']

        if not data['no_ai']:
            # summary job got created
            sql = """
            select id from jobs 
            where method='entry' and data_in->'args'->>0=:eid
            """
            args = {'eid': eid}
            assert M.await_row(db, sql, args=args, timeout=2)

            # summaries generated
            sql += " and state='done'"
            assert M.await_row(db, sql, args=args, timeout=120)
            res = client.get(f"/entries/{eid}", **u.user.header)
            assert res.status_code == 200
            res = res.json()
            assert res['ai_ran'] is True
            assert res['title_summary']
            assert res['text_summary']

        return eid
    return _post_entry

@pytest.fixture()
def count(db):
    def _count(table):
        return db.execute(f"select count(*) ct from {table}").fetchone().ct
    return _count
