import random, datetime, pytest
import common.models as M
from app.influencers import influencers
from common.fixtures import fixtures
from app.xgb import MyXGB
from sqlalchemy import text


@pytest.fixture(scope='module', autouse=True)
def setup_fields(main_uid, db):
    fixtures.submit_fields(main_uid, db)

def run_influencers(db):
    db.execute("""
    update users set updated_at=now(), last_influencers=now() - interval '25 hours';
    """)
    db.commit()
    influencers()

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
    run_influencers(db)

    # Test duplicate key bug
    run_influencers(db)

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
    # TODO how to test this properly?
    assert len(inf) <= len(user.fields) * len(user.fields)

    score_total = 0.
    for i in inf:
        score_total += i.score
        assert i.score is not None
    assert score_total


@pytest.mark.parametrize("n_days", [0, MyXGB.too_small - 2, 100])  # no run, small_params, standard
def test_hyper_caching(n_days, main_uid, db):
    db.execute("delete from model_hypers;delete from fields")
    db.commit()

    def ct_hypers():
        return db.execute(text("""
        select count(*) ct from model_hypers where user_id=:uid
        """), dict(uid=main_uid)).fetchone().ct

    fixtures.submit_fields(main_uid, db, n_days=n_days)
    assert ct_hypers() == 0
    run_influencers(db)
    if n_days < MyXGB.too_small:
        assert ct_hypers() == 0
        return

    assert ct_hypers() == 1
    run_influencers(db)
    assert ct_hypers() == 2
    run_influencers(db)
    run_influencers(db)
    run_influencers(db)
    assert ct_hypers() == 3

    db.execute("update model_hypers set model_version=999")
    db.commit()
    run_influencers(db)
    assert ct_hypers() == 1



# TODO test corrupt data (lots of nulls, new fields, etc)
# TODO no field-entries
# TODO few field-entries
# TODO enough field-entries
