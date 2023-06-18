import random, datetime, pytest, pdb
import common.models as M
from app import ml
from common.fixtures import fixtures

def test_influencers(client, u, db, count):
    # TODO set these up in fixture. Currently `u` fixture is function-scope, and wipes user b/w
    uid, header = u.user.id, u.user.header
    fixtures.submit_fields(uid, db, client, header)

    # set last_updated so it's stale
    # The other stale/fresh/just-right checks are in gpu/tests
    db.execute("""
    update users set updated_at=now() - interval '5 days',
        last_influencers=now() - interval '5 days'
    where id=:uid
    """, dict(uid=uid))
    db.commit()
    client.post('user/checkin', **header)

    # run cron
    jid = ml.run_influencers()
    sql = "select 1 from jobs where id=:jid and state='done'"
    assert M.await_row(db, sql, {'jid': jid}, timeout=200)

    assert count("influencers") > 0
    fs = client.get('/fields', **header)
    assert fs.status_code == 200
    fs = fs.json()

    inf = client.get('/influencers', **header)
    assert inf.status_code == 200
    inf = inf.json()
    assert type(inf) == dict

    for fid, f in fs.items():
        assert f['next_pred'] is not None
        assert f['influencer_score'] is not None
        assert type(inf[fid]) == dict
        total_score = 0
        for _, score in inf[fid].items():
            assert score is not None
            total_score += score
        assert total_score > 0

# TODO no field-entries
# TODO few field-entries
# TODO enough field-entries
