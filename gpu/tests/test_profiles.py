import pytest
from uuid import uuid4
from box import Box
import common.models as M
from common.fixtures import fixtures
import app.entries_profiles as e_p

@pytest.fixture(scope='module')
def setup_profiles(db, entries, main_uid):
    db.execute("delete from entries;delete from cache_entries;")
    db.commit()

    user1 = db.query(M.User).get(main_uid)
    user2 = None
    therapists = Box()
    for k in 'other therapist_vr therapist_cbt therapist_mix therapist_na'.split():
        user = M.User(id=uuid4(), **fixtures.users[k])
        if k == 'other':
            user2 = user
        else:
            user.therapist = True
            therapists[k] = user
        db.add(user)
    db.commit()

    for k, v in entries.items():
        entry = M.Entry(title=k, text=v.text)
        if k.startswith('vr'):
            entry.user_id=main_uid
        elif k.startswith('cbt'):
            entry.user_id=user2.id
        else: continue
        db.add(entry)
    db.commit()

    e_p.entries()
    e_p.profiles()

    return user1, user2, therapists

def test_profiles_ran(setup_profiles, db):
    user1, user2, therapists = setup_profiles
    ids = [u.id for k, u in therapists.items()]
    cache_users = db.query(M.CacheUser)\
        .filter(M.CacheUser.user_id.in_(ids))\
        .all()
    assert len(cache_users) == 3  # excludes therapist_na
    users = db.query(M.User)\
        .filter(M.User.id.in_([cu.user_id for cu in cache_users]))\
        .all()
    for u in users:
        assert u.ai_ran is True

def test_matches_made(db, setup_profiles):
    user1, user2, therapists = setup_profiles
    matches = db.execute("""
    select pm.user_id, u.email, pm.score from profile_matches pm
    inner join users u on pm.match_id=u.id
    """).fetchall()
    assert len(matches) == 6  # 3 * [user1,user2]

    def matches_(uid):
        return Box({
            m.email.split('@')[0]: m
            for m in matches
            if m.user_id == uid
        })

    m = matches_(user1.id)
    # cosine DISTANCES; smaller is better
    assert m.therapist_mix.score < m.therapist_cbt.score
    assert m.therapist_vr.score < m.therapist_mix.score

    m = matches_(user2.id)
    assert m.therapist_mix.score < m.therapist_vr.score
    assert m.therapist_cbt.score < m.therapist_mix.score
