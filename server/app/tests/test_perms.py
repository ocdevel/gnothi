import pytest
from sqlalchemy import text


@pytest.fixture
def crud_with_perms(u, count):
    def _crud_with_perms(
        fn,
        route: str,
        table: str,
        ct_delta: int,
        their_own: bool = False,
        therapist_can: bool = False,
        data: dict = None,
    ):
        ct = count(table)
        data = {'json': data} or {}

        if not their_own:
            res = fn(route, **data, **u.other.header)
            assert res.status_code == 404
            res = fn(route, **data, **u.therapist.header)
            assert res.status_code == 404
            assert count(table) == ct

        res = fn(f"{route}?as_user={u.user.id}", **data, **u.other.header)
        # FIXME come up with more consistent non-access error handling
        assert res.status_code in [401, 404]
        res = fn(f"{route}?as_user={u.user.id}", **data, **u.therapist.header)
        if therapist_can:
            assert res.status_code == 200
        else:
            assert res.status_code in [401, 404]
        assert count(table) == ct

        res = fn(route, **data, **u.user.header)
        assert res.status_code == 200
        assert count(table) == ct+ct_delta
    return _crud_with_perms

def test_post(client, u, crud_with_perms):
    data = {'title': 'Title', 'text': 'Text', 'tags': u.user.tag1, 'no_ai': True}
    crud_with_perms(client.post, '/entries', 'entries', 1, data=data, their_own=True)


def test_get(client, post_entry, crud_with_perms):
    eid = post_entry()
    crud_with_perms(client.get, f"/entries/{eid}", 'entries', 0, therapist_can=True)


def test_put(client, post_entry, u, crud_with_perms):
    eid = post_entry()
    data = {'title': 'Title2', 'text': 'Text2', 'tags': u.user.tag1, 'no_ai': True}
    crud_with_perms(client.put, f"/entries/{eid}", 'entries', 0, data=data)
    res = client.get(f"/entries/{eid}", **u.user.header)
    data = res.json()
    assert data['title'] == 'Title2'
    assert data['text'] == 'Text2'


def test_delete(client, post_entry, crud_with_perms):
    eid = post_entry()
    crud_with_perms(client.delete, f"/entries/{eid}", 'entries', -1)


def test_update_last_seen(client, post_entry, u, db):
    post_entry()
    post_entry()
    post_entry(tags=u.user.tag2)
    sql = text("select * from shares where email=:email")
    assert db.execute(sql, dict(email=u.therapist.email)).fetchone().new_entries == 2
    assert db.execute(sql, dict(email=u.friend.email)).fetchone().new_entries == 1
    assert db.execute(sql, dict(email=u.other.email)).fetchone() is None
    assert db.execute(sql, dict(email=u.user.email)).fetchone() is None

    # therapist checks
    res = client.get(f"/entries?as_user={u.user.id}", **u.therapist.header)
    assert res.status_code == 200
    assert db.execute(sql, dict(email=u.friend.email)).fetchone().new_entries == 1
    assert db.execute(sql, dict(email=u.therapist.email)).fetchone().new_entries == 0

    # one more time
    post_entry()
    assert db.execute(sql, dict(email=u.therapist.email)).fetchone().new_entries == 1
