import os, pdb, pytest, time, random, datetime
from sqlalchemy import text
from lorem_text import lorem


import logging
logger = logging.getLogger(__name__)

import common.models as M

@pytest.fixture()
def submit_job(client, u):
    def _submit_job(k, data, code=200):
        res = client.post(f"/{k}", json=data, **u.user.header)
        json = res.json()
        if code == 200:
            assert res.status_code == code
        # At this point, if we're expecting a non-200 it could come AFTER job-submission,
        # so don't assert it yet
        elif res.status_code == code:
            return json
        assert json['jid']
        assert json['queue'] is not None
        res = client.get(f"/await-job/{json['jid']}", **u.user.header)
        assert res.status_code == code
        return res.json()
    return _submit_job


@pytest.fixture()
def ml_jobs(client, u, submit_job):
    def _ml_jobs(limit_entries, code):
        res = submit_job("themes", data=limit_entries, code=code)
        data = {**limit_entries, 'question': "What is VR?"}
        res = submit_job("ask", data=data, code=code)
        assert len(res) > 0
        data = {**limit_entries, 'words': 300}
        res = submit_job("summarize", data=data, code=code)
        assert len(res) > 0
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


def test_entries_ml(post_entry, db, client, u, ml_jobs, submit_job):
    # TODO use wikipedia entries to actually test qualitative results
    post_entry(0, no_ai=False)
    post_entry(1, no_ai=False)
    post_entry(2, no_ai=False)

    main_tag = list(u.user.tag1.keys())
    limit_entries = {'days': 10, 'tags': main_tag}
    res = submit_job("themes", data=limit_entries)
    assert res['terms']
    assert len(res['themes']) > 0

    main_tag = list(u.user.tag1.keys())
    limit_entries = {'days': 10, 'tags': main_tag}
    ml_jobs(limit_entries, 200)

    sql = "select id from jobs where method='books'"
    assert M.await_row(db, sql, timeout=100)

    sql = "select id, state from jobs where state in ('done', 'error') and method='books'"
    res = M.await_row(db, sql, timeout=200)
    assert res
    assert res.state == 'done'
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

