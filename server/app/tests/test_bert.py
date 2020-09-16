import os, pdb, pytest, time, random, datetime
from sqlalchemy import text
from lorem_text import lorem

import logging
logger = logging.getLogger(__name__)

import common.models as M


@pytest.fixture()
def ml_jobs(client, u):
    def _ml_jobs(limit_entries, code):
        res = client.post("/themes", json=limit_entries, **u.user.header)
        assert res.status_code == code
        data = {**limit_entries, 'query': "Who am I?"}
        res = client.post("/query", json=data, **u.user.header)
        assert res.status_code == code
        data = {**limit_entries, 'words': 300}
        res = client.post("/summarize", json=data, **u.user.header)
        assert res.status_code == code
    return _ml_jobs

@pytest.mark.skip()
def test_entries_count(post_entry, u, ml_jobs):
    # TODO need to handle not enough data 400 situation

    # none
    main_tag = list(u.user.tag1.keys())
    limit_entries = {'days': 10, 'tags': main_tag}
    ml_jobs(limit_entries, 400)

    # 1, still not enough
    eid = post_entry()
    ml_jobs(limit_entries, 400)

    # 2, enough now
    eid = post_entry()
    ml_jobs(limit_entries, 200)

    # 2, enough - but no tags selected
    limit_entries['tags'] = {}
    ml_jobs(limit_entries, 400)


@pytest.mark.timeout(120)
def test_caching(client, u, db, post_entry):
    post_entry(no_ai=False)
    post_entry(no_ai=False)

    # themes
    main_tag = list(u.user.tag1.keys())
    limit_entries = {'days': 10, 'tags': main_tag}
    res = client.post("/themes", json=limit_entries, **u.user.header)
    assert res.status_code == 200, str(res.json())
    res = res.json()
    assert res['terms']
    assert len(res['themes']) > 0

    # books job created
    sql = "select id from jobs where method='books'"
    assert M.await_row(db, sql, timeout=2)

    # books generated
    sql = "select id from jobs where state='done' and method='books'"
    assert M.await_row(db, sql, timeout=120)
    res = client.get(f"/books/ai", **u.user.header)
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

