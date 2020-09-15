import os, pdb, pytest, time, random, datetime
from sqlalchemy import text
from lorem_text import lorem

import logging
logger = logging.getLogger(__name__)

import common.models as M
from app import ml


@pytest.fixture
def crud_with_perms(u, assert_count, count):
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
            assert_count(table, ct)

        res = fn(f"{route}?as_user={u.user.id}", **data, **u.other.header)
        # FIXME come up with more consistent non-access error handling
        assert res.status_code in [401, 404]
        res = fn(f"{route}?as_user={u.user.id}", **data, **u.therapist.header)
        if therapist_can:
            assert res.status_code == 200
        else:
            assert res.status_code in [401, 404]
        assert_count(table, ct)

        res = fn(route, **data, **u.user.header)
        assert res.status_code == 200
        assert_count(table, ct+ct_delta)
    return _crud_with_perms


class JobStatus():
    def test_job_status(self, client, u):
        res = client.get('/job-status', **u.user.header)
        assert res.json()['status'] == 'on'
        assert res.status_code == 200


class TestEntries():
    def test_post(self, client, u, crud_with_perms):
        data = {'title': 'Title', 'text': 'Text', 'tags': u.user.tag1, 'no_ai': True}
        crud_with_perms(client.post, '/entries', 'entries', 1, data=data, their_own=True)

    def test_get(self, client, post_entry, crud_with_perms):
        eid = post_entry()
        crud_with_perms(client.get, f"/entries/{eid}", 'entries', 0, therapist_can=True)

    def test_put(self, client, post_entry, u, crud_with_perms):
        eid = post_entry()
        data = {'title': 'Title2', 'text': 'Text2', 'tags': u.user.tag1, 'no_ai': True}
        crud_with_perms(client.put, f"/entries/{eid}", 'entries', 0, data=data)
        res = client.get(f"/entries/{eid}", **u.user.header)
        data = res.json()
        assert data['title'] == 'Title2'
        assert data['text'] == 'Text2'

    def test_delete(self, client, post_entry, crud_with_perms):
        eid = post_entry()
        crud_with_perms(client.delete, f"/entries/{eid}", 'entries', -1)

    def test_update_last_seen(self, client, post_entry, u, db):
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


class TestML():
    def test_influencers(self, client, u, db):
        # TODO no field-entries
        # TODO few field-entries
        # TODO enough field-entries
        # res = client.get("/influencers", **header('user'))

        fs = list(range(10))
        for i, _ in enumerate(fs):
            # create fields (some targets
            data = dict(
                type='fivestar',
                name=str(i),
                default_value='average',
                target=i>7
            )
            res = client.post("/fields", json=data, **u.user.header)
            assert res.status_code == 200
            fs[i] = res.json()

            # create field-entries for 10 days (would use API, but can't set created_at)
            for d in range(10):
                fe = M.FieldEntry(
                    field_id=fs[i]['id'],
                    user_id=u.user.id,
                    value=random.randint(-5, 5),
                    created_at=datetime.datetime.today() - datetime.timedelta(days=d)
                )
                db.add(fe)
            db.commit()
        # set last_updated so it's stale
        db.execute("update users set updated_at=now() - interval '5 days'")
        db.commit()

        client.post('user/checkin', **u.user.header)

        # run cron
        jid = ml.run_influencers()
        sql = "select 1 from jobs where id=:jid and state='done'"
        assert M.await_row(db, sql, {'jid': jid}, timeout=120)

        # check output
        res = client.get('/influencers', **u.user.header)
        assert res.status_code == 200
        res = res.json()
        assert res['overall']
        assert res['per_target']
        assert res['next_preds']
        print(res)

        res = client.get(f"/influencers?target={fs[-1]['id']}", **u.user.header)
        assert res.status_code == 200
        res = res.json()
        assert res['overall']
        assert res['per_target']
        assert res['next_preds']


    def _ml_jobs(self, c, u, limit_entries, code):
        res = c.post("/themes", json=limit_entries, **u.user.header)
        assert res.status_code == code
        data = {**limit_entries, 'query': "Who am I?"}
        res = c.post("/query", json=data, **u.user.header)
        assert res.status_code == code
        data = {**limit_entries, 'words': 300}
        res = c.post("/summarize", json=data, **u.user.header)
        assert res.status_code == code

    @pytest.mark.skip()
    def test_entries_count(self, client, post_entry, u):
        # TODO need to handle not enough data 400 situation

        # none
        main_tag = list(u.user.tag1.keys())
        limit_entries = {'days': 10, 'tags': main_tag}
        self._ml_jobs(client, u, limit_entries, 400)

        # 1, still not enough
        eid = post_entry()
        self._ml_jobs(client, u, limit_entries, 400)

        # 2, enough now
        eid = post_entry()
        self._ml_jobs(client, u, limit_entries, 200)

        # 2, enough - but no tags selected
        limit_entries['tags'] = {}
        self._ml_jobs(client, u, limit_entries, 400)

    def test_caching(self, client, u, db, post_entry):
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

