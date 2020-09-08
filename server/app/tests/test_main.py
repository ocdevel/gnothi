import os, pdb, pytest, time
from box import Box
from sqlalchemy import text
from fastapi.testclient import TestClient
from lorem_text import lorem

import logging
logger = logging.getLogger(__name__)

os.environ["DB_NAME"] = "gnothi_test"
os.environ["ENVIRONMENT"] = "development"
from common.utils import vars
from sqlalchemy_utils import database_exists, create_database, drop_database
# if database_exists(vars.DB_URL): drop_database(vars.DB_URL)
if not database_exists(vars.DB_URL): create_database(vars.DB_URL)

import common.database as D
import common.models as M
from app.main import app

exec = D.engine.execute
sess_main = D.SessLocal.main()

# Friend only used to double-check sharing features
u = Box(user={}, therapist={}, friend={}, other={})
def header(k):
    return {"headers": {"Authorization": f"Bearer {u[k].token}"}}

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def setup_users(client):
    # with TestClient(app) as client:
    logger.warning("deleting")
    exec("delete from users;delete from jobs;")
    for t in 'bookshelf entries entries_tags field_entries fields notes people shares shares_tags tags users'.split():
        assert exec(f"select count(*) ct from {t}").fetchone().ct == 0, \
            "{t} rows remained after 'delete * from users', check cascade-delete on children"
    logger.warning("creating users")
    for k, _ in u.items():
        email = k + "@x.com"
        u[k] = {'email': email}
        form = {'email': email, 'password': email}
        res = client.post("/auth/register", json=form)
        assert res.status_code == 201

        form = {'username': email, 'password': email}
        res = client.post("/auth/jwt/login", data=form)
        assert res.status_code == 200
        u[k]['token'] = res.json()['access_token']

        res = client.get("/user", **header(k))
        assert res.status_code == 200
        u[k]['id'] = res.json()['id']

        res = client.get("/tags", **header(k))
        assert res.status_code == 200
        u[k]['tag1'] = {res.json()[0]['id']: True}

    logger.warning("jobs-status")
    # init jobs-status table
    res = client.get('/jobs-status', **header('user'))
    assert res.status_code == 200
    assert res.json() == 'on'

    logger.warning("sharing")
    # share user main tag with therapist
    data = dict(email=u.therapist.email, tags=u.user.tag1)
    res = client.post('/shares', json=data, **header('user'))
    assert res.status_code == 200

    # share user secondary tag with friend
    res = client.post("/tags", json={'name': 'Fun'}, **header('user'))
    assert res.status_code == 200
    u.user['tag2'] = {res.json()['id']: True}
    data = dict(email=u.friend.email, tags=u.user.tag2)
    res = client.post('/shares', json=data, **header('user'))
    assert res.status_code == 200

    # yield
    # await D.fa_users_db.disconnect()
    # D.shutdown_db()


def _count(table):
    return exec(f"select count(*) ct from {table}").fetchone().ct


def _assert_count(table, expected):
    assert _count(table) == expected


def _post_entry(c, extra={}):
    data = {**dict(
        title='Title',
        text=lorem.paragraphs(5),
        no_ai=True,
        tags=u.user.tag1,
    ), **extra}
    res = c.post("/entries", json=data, **header('user'))
    assert res.status_code == 200
    return res.json()['id']


def _crud_with_perms(
    fn,
    route: str,
    table: str,
    ct_delta: int,
    their_own: bool = False,
    therapist_can: bool = False,
    data: dict = None,
):
    ct = _count(table)
    data = {'json': data} or {}

    if not their_own:
        res = fn(route, **data, **header('other'))
        assert res.status_code == 404
        res = fn(route, **data, **header('therapist'))
        assert res.status_code == 404
        _assert_count(table, ct)

    res = fn(f"{route}?as_user={u.user.id}", **data, **header('other'))
    # FIXME come up with more consistent non-access error handling
    assert res.status_code in [401, 404]
    res = fn(f"{route}?as_user={u.user.id}", **data, **header('therapist'))
    if therapist_can:
        assert res.status_code == 200
    else:
        assert res.status_code in [401, 404]
    _assert_count(table, ct)

    res = fn(route, **data, **header('user'))
    assert res.status_code == 200
    _assert_count(table, ct+ct_delta)


class JobStatus():
    def test_job_status(self, client):
        res = client.get('/job-status', **header('user'))
        assert res.json()['status'] == 'on'
        assert res.status_code == 200


class TestEntries():
    def test_post(self, client):
        data = {'title': 'Title', 'text': 'Text', 'tags': u.user.tag1}
        _crud_with_perms(client.post, '/entries', 'entries', 1, data=data, their_own=True)

    def test_get(self, client):
        eid = _post_entry(client)
        _crud_with_perms(client.get, f"/entries/{eid}", 'entries', 0, therapist_can=True)

    def test_put(self, client):
        eid = _post_entry(client)
        data = {'title': 'Title2', 'text': 'Text2', 'tags': u.user.tag1}
        _crud_with_perms(client.put, f"/entries/{eid}", 'entries', 0, data=data)
        res = client.get(f"/entries/{eid}", **header('user'))
        data = res.json()
        assert data['title'] == 'Title2'
        assert data['text'] == 'Text2'

    def test_delete(self, client):
        eid = _post_entry(client)
        _crud_with_perms(client.delete, f"/entries/{eid}", 'entries', -1)

    def test_update_last_seen(self, client):
        _post_entry(client)
        _post_entry(client)
        _post_entry(client, {'tags': u.user.tag2})
        sql = "select * from shares where email=:email"
        assert exec(text(sql), email=u.therapist.email).fetchone().new_entries == 2
        assert exec(text(sql), email=u.friend.email).fetchone().new_entries == 1
        assert exec(text(sql), email=u.other.email).fetchone() is None
        assert exec(text(sql), email=u.user.email).fetchone() is None

        # therapist checks
        res = client.get(f"/entries?as_user={u.user.id}", **header('therapist'))
        assert res.status_code == 200
        assert exec(text(sql), email=u.friend.email).fetchone().new_entries == 1
        assert exec(text(sql), email=u.therapist.email).fetchone().new_entries == 0

        # one more time
        _post_entry(client)
        assert exec(text(sql), email=u.therapist.email).fetchone().new_entries == 1


class TestML():
    def test_influencers(self, client):
        # TODO no field-entries
        # TODO few field-entries
        # TODO enough field-entries
        # res = client.get("/influencers", **header('user'))
        pass

    def _ml_jobs(self, c, limit_entries, code):
        return
        res = c.post("/themes", data=limit_entries, **header('user'))
        assert res.status_code == code
        data = {**limit_entries, 'query': "Who am I?"}
        res = c.post("/query", data=data, **header("user"))
        assert res.status_code == code
        data = {**limit_entries, 'words': 300}
        res = c.post("/summarize", data=data, **header('user'))
        assert res.status_code == code

    def test_entries_count(self, client):
        return
        # none
        main_tag = list(u.user.tag1.keys())[0]
        limit_entries = {'days': 10, 'tags': main_tag}
        self._ml_jobs(client, limit_entries, 400)

        # 1, still not enough
        eid = _post_entry(client)
        self._ml_jobs(client, limit_entries, 400)

        # 2, enough now
        eid = _post_entry(client)
        self._ml_jobs(client, limit_entries, 200)

        # 2, enough - but no tags selected
        limit_entries['tags'] = {}
        self._ml_jobs(client, limit_entries, 400)

    def _create_entry_ai(self, c):
        # TODO use "and data>>entry_id=x" json query (whatever the syntax is)
        exec("delete from jobs;")
        eid = _post_entry(c, {'no_ai': False})

        # summary job got created
        sql = "select id from jobs where method='entry'"
        assert M.await_row(sess_main, sql, timeout=2)

        # summaries generated
        sql = "select id from jobs where state='done' and method='entry'"
        res = M.await_row(sess_main, sql, timeout=40)
        assert res
        res = c.get(f"/entries/{eid}", **header('user'))
        assert res.status_code == 200
        res = res.json()
        assert res['ai_ran'] == True
        assert res['title_summary']
        assert res['text_summary']

    def test_entry_summaries(self, client):
        self._create_entry_ai(client)

    def test_summaries_books(self, client):
        self._create_entry_ai(client)
        self._create_entry_ai(client)

        # books job created
        sql = "select id from jobs where method='books'"
        assert M.await_row(sess_main, sql, timeout=2)

        # books generated
        sql = "select id from jobs where state='done' and method='books'"
        assert M.await_row(sess_main, sql, timeout=120)
        res = client.get(f"/books/ai", **header('user'))
        assert res.status_code == 200
        res = res.json()
        assert len(res) > 0

    # def test_few_entries(self, client):
    #     eid = _post_entry(client)
    #
    #     # res = client.get("/influencers", **header('user'))
    #     limit_entries = {'days': 10, 'tags': u.user.tag1}
    #     res = client.post("/themes", json=limit_entries, **header('user'))
    #     assert res.status_code == 400
    #     # post /books
    #     # post /query (M.SIQuestion)
    #     # post /summarize (M.SISummarize)

