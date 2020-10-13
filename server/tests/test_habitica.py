from common.utils import vars
import common.models as M
from app.habitica import sync_for
from sqlalchemy import text

def test_no_creds(u, db):
    user = db.query(M.User).get(u.user.id)
    sync_for(user)
    assert True

def test_broken_creds(u, db):
    db.query(text("""
    update users set habitica_user_id='xxxx', habitica_api_token='yyyy'
    where id=:uid 
    """), dict(uid=u.user.id))
    db.commit()
    user = db.query(M.User).get(u.user.id)
    sync_for(user)

def test_habitica(u, db):
    uid = u.user.id
    args = dict(habit_user=vars.HABIT_USER, habit_api=vars.HABIT_API, uid=uid)
    res = db.query(text("""
    update users set habitica_user_id=:habit_user, habitica_api_token=:habit_api
    where id=:uid;
    select count(*) ct from fields where user_id=:uid
    """), args).fetchone().ct
    db.commit()
    user = db.query(M.User).get(u.user.id)
    sync_for(user)
    res2 = db.query(text("""
    select count(*) ct from fields where user_id=:uid
    """), dict(uid=uid)).fetchone()
    assert res2.ct > res.ct

