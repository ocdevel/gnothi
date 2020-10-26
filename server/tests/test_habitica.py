from common.utils import vars
import common.models as M
from app.habitica import sync_for
from sqlalchemy import text
import pytest

def test_no_creds(u, db):
    user = db.query(M.User).get(u.user.id)
    sync_for(user)
    assert True

def test_broken_creds(u, db):
    user = db.query(M.User).get(u.user.id)
    user.habitica_user_id='xxxx'
    user.habitica_api_token='yyyy'
    db.commit()
    db.refresh(user)
    sync_for(user)

# FIXME is_dev() prevents send to habitica API. Figure out best way to test this without spamming
@pytest.mark.skip()
def test_habitica(u, db):
    uid = u.user.id
    user = db.query(M.User).get(uid)
    user.habitica_user_id=vars.HABIT_USER
    user.habitica_api_token=vars.HABIT_API
    db.commit()
    db.refresh(user)
    res = db.execute(text("""
    select count(*) ct from fields where user_id=:uid
    """), dict(uid=uid)).fetchone()
    sync_for(user)
    res2 = db.execute(text("""
    select count(*) ct from fields where user_id=:uid
    """), dict(uid=uid)).fetchone()
    assert res2.ct > res.ct

