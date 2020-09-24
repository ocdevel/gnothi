import pytest, time
from uuid import uuid4
from box import Box
import common.models as M
from common.fixtures import fixtures

def test_therapists(db, client, u, post_entry):
    post_entry(0)
    post_entry(1)
    post_entry(2)
    post_entry(3)

    # kick off profiles job
    client.put("/profile", json=dict(first_name="Tyler"), **u.user.header)
    sql = "select 1 from profile_matches where user_id=:uid"
    res = M.await_row(db, sql, dict(uid=u.user.id), timeout=20)
    assert res

    res = client.get("/therapists", **u.user.header)
    assert res.status_code == 200
    res = res.json()
    # assert len(res) == len([
    #     1 for k, v in fixtures.users.items()
    #     if k.startswith('therapist_')
    # ])
    assert len(res) == 3
