import os, pdb, pytest
from box import Box
from fastapi.testclient import TestClient

os.environ["DB_NAME"] = "gnothi_test"
os.environ["ENVIRONMENT"] = "development"
from app.utils import vars
from sqlalchemy_utils import database_exists, create_database, drop_database
if database_exists(vars.DB_URL):
    drop_database(vars.DB_URL)
create_database(vars.DB_URL)

import app.database as D
import app.models as M
from app.main import app

exec = D.engine.execute

u = Box(user={}, therapist={}, other={})
def header(k):
    return {"headers": {"Authorization": f"Bearer {u[k].token}"}}

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def setup_users(client):
    # with TestClient(app) as client:
    exec("delete from users where true")
    for t in 'bookshelf entries entries_tags field_entries fields notes people shares shares_tags tags users'.split():
        assert exec(f"select count(*) ct from {t}").fetchone().ct == 0, \
            "{t} rows remained after 'delete * from users', check cascade-delete on children"
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
        u[k]['tags'] = {res.json()[0]['id']: True}

    # share user main tag
    data = dict(email=u.therapist.email, tags=u.user.tags)
    res = client.post('/shares', json=data, **header('user'))
    assert res.status_code == 200

    # yield
    # await D.fa_users_db.disconnect()
    # D.shutdown_db()


def _count(table):
    return exec(f"select count(*) ct from {table}").fetchone().ct


def _assert_count(table, expected):
    assert _count(table) == expected


def _post_entry(c):
    data = {'title': 'Title', 'text': 'Text', 'tags': u.user.tags}
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


class TestEntries():
    def test_post(self, client):
        data = {'title': 'Title', 'text': 'Text', 'tags': u.user.tags}
        _crud_with_perms(client.post, '/entries', 'entries', 1, data=data, their_own=True)

    def test_get(self, client):
        eid = _post_entry(client)
        _crud_with_perms(client.get, f"/entries/{eid}", 'entries', 0, therapist_can=True)

    def test_put(self, client):
        eid = _post_entry(client)
        data = {'title': 'Title2', 'text': 'Text2', 'tags': u.user.tags}
        _crud_with_perms(client.put, f"/entries/{eid}", 'entries', 0, data=data)
        res = client.get(f"/entries/{eid}", **header('user'))
        data = res.json()
        assert data['title'] == 'Title2'
        assert data['text'] == 'Text2'

    def test_delete(self, client):
        eid = _post_entry(client)
        _crud_with_perms(client.delete, f"/entries/{eid}", 'entries', -1)
