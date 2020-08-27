import os, pdb, pytest
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

users = {}
def header(u):
    return {"headers": {"Authorization": f"Bearer {users[u]}"}}

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def setup_users(client):
    # with TestClient(app) as client:
    D.engine.execute("delete from users where true")
    for t in 'bookshelf entries entries_tags field_entries fields notes people shares shares_tags tags users'.split():
        assert D.engine.execute(f"select count(*) ct from {t}").fetchone().ct == 0, \
            "{t} rows remained after 'delete * from users', check cascade-delete on children"
    for u in ['user@x.com', 'therapist@x.com', 'friend@x.com', 'other@x.com']:
        form = {'email': u, 'password': u}
        res = client.post("/auth/register", json=form)
        assert res.status_code == 201
        form = {'username': u, 'password': u}
        res = client.post("/auth/jwt/login", data=form)
        assert res.status_code == 200
        users[u] = res.json()['access_token']

    # yield
    # await D.fa_users_db.disconnect()
    # D.shutdown_db()


def test_read_main(client):
    u = 'user@x.com'
    res = client.get("/user", **header(u))
    assert res.status_code == 200
    assert res.json()['email'] == u


def test_delete_entry(client):
    u = 'user@x.com'
    # TODO get main tag
    res = client.get('/tags', **header(u))
    tags = {res.json()[0]['id']: True}
    data = {'title': 'Title', 'text': 'Text', 'tags': tags}
    res = client.post("/entries", json=data, **header(u))
    print(res.text)
    assert res.status_code == 200
    eid = res.json()['id']
    assert D.engine.execute("select count(*) ct from entries").fetchone().ct == 1
    res = client.delete(f"/entries/{eid}", **header(u))
    assert res.status_code == 200
    assert D.engine.execute("select count(*) ct from entries").fetchone().ct == 0
