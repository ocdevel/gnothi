import pytest
from uuid import uuid4
from box import Box
import common.models as M
from common.fixtures import fixtures
import app.entries_profiles as e_p

e = fixtures.entries
vr1, vr2 = e.Virtual_reality_0.text, e.Virtual_reality_1.text
cbt1, cbt2 = e.Cognitive_behavioral_therapy_0.text, e.Cognitive_behavioral_therapy_1.text

@pytest.fixture(scope='module')
def divide_user_entries(db, entries, main_uid):
    db.execute("delete from entries;delete from cache_entries;")
    db.commit()

    user1 = db.query(M.User).get(main_uid)
    user2 = M.User(id=uuid4(), **fixtures.users.other)
    db.add(user2)
    db.commit()

    for k, v in entries.items():
        entry = M.Entry(title=k, text=v.text)
        if k.startswith('Virtual_reality'):
            entry.user_id=main_uid
        elif k.startswith('Cognitive_behavioral_therapy'):
            entry.user_id=user2.id
        else: continue
        db.add(entry)
    db.commit()
    e_p.entries()

    return user1, user2

@pytest.fixture(scope='module')
def therapists(divide_user_entries, db):
    u = Box(
        therapist_vr=None,
        therapist_mix=None,
        therapist_cbt=None,
        therapist_na=None
    )
    for k, _ in u.items():
        email = k + "@x.com"
        user = M.User(id=uuid4(), therapist=True, first_name=k, email=email, hashed_password=email)
        u[k] = user
        db.add(user)
    u.therapist_vr.bio = vr1 + "\n" + vr2
    u.therapist_mix.bio = vr1 + "\n" + cbt1
    u.therapist_cbt.bio = cbt1 + "\n" + cbt2
    u.therapist_na.bio = None

    db.commit()
    # divide_user_entries needed for this step
    e_p.profiles()
    return u

def test_profiles_ran(therapists, db, divide_user_entries):
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

def test_matches_made(db, divide_user_entries, therapists):
    user1, user2 = divide_user_entries
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
