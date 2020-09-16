import random, datetime
import common.models as M
from app import ml


def test_influencers(client, u, db):
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
            target=i > 7
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
