import random, datetime, pytest
import common.models as M
from app.influencers import influencers


@pytest.fixture(scope='module', autouse=True)
def setup_fields(main_uid, db):
    fs = list(range(10))
    for i, _ in enumerate(fs):
        # create fields (some targets
        data = dict(
            type='fivestar',
            name=str(i),
            default_value='average',
        )
        field = M.Field(**data, user_id=main_uid)
        db.add(field)
        db.commit()
        fs[i] = field

        # create field-entries for 10 days
        # 1. leave some nulls in there
        # 2. stagger range() as if we're creating new fields each day
        db.bulk_save_objects([
            M.FieldEntry(
                field_id=field.id,
                user_id=main_uid,
                # value=random.choice([
                #     None,
                #     random.randint(-5, 5)
                # ]),
                value=random.randint(-5,5),
                created_at=datetime.datetime.today() - datetime.timedelta(days=d)
            )
            for d in range(10-i)
        ])
        db.commit()

def test_stale_user(db):
    db.execute("""
    update users set updated_at=now() - interval '5 days';
    delete from influencers;
    """)
    db.commit()
    influencers()
    assert len(db.query(M.Influencer).all()) == 0


def test_already_ran(db):
    db.execute("""
    update users set updated_at=now(), last_influencers=now();
    delete from influencers;
    """)
    db.commit()
    influencers()
    assert len(db.query(M.Influencer).all()) == 0


def test_influencers(main_uid, db):
    db.execute("""
    update users set updated_at=now(), last_influencers=now() - interval '25 hours';
    delete from influencers;
    """)
    db.commit()

    influencers()

    # check output
    user = db.query(M.User).get(main_uid)
    # assert user.last_influencers is recent

    # make sure not everything is 0 (but some can be)
    score_total = 0.
    next_pred_total = 0.
    for f in user.fields:
        score_total += f.influencer_score
        next_pred_total += f.next_pred
        assert f.influencer_score is not None
        assert f.next_pred is not None
    assert score_total
    assert next_pred_total

    inf = db.query(M.Influencer).all()
    assert len(inf) > 10

    score_total = 0.
    for i in inf:
        score_total += i.score
        assert i.score is not None
    assert score_total

# TODO test corrupt data (lots of nulls, new fields, etc)
# TODO no field-entries
# TODO few field-entries
# TODO enough field-entries
