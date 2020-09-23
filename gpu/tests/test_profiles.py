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
def user_only_likes_vr(db, entries, main_uid):
    db.execute("delete from entries;delete from cache_entries;")
    db.commit()
    for k, v in entries.items():
        if not k.startswith('Virtual_reality'): continue
        db.add(M.Entry(title=k, text=v.text, user_id=main_uid))
    db.commit()
    e_p.entries()

@pytest.fixture(scope='module')
def therapists(user_only_likes_vr, db):
    # best is 100% topic overlap; good 50/50; bad none; therapist_na is no profile
    u = Box(
        therapist_best=None,
        therapist_good=None,
        therapist_bad=None,
        therapist_na=None
    )
    for k, _ in u.items():
        email = k + "@x.com"
        user = M.User(id=uuid4(), therapist=True, first_name=k, email=email, hashed_password=email)
        u[k] = user
        db.add(user)
    u.therapist_best.bio = vr1 + "\n" + vr2
    u.therapist_good.bio = vr1 + "\n" + cbt1
    u.therapist_bad.bio = cbt1 + "\n" + cbt2
    u.therapist_na.bio = None

    db.commit()
    e_p.profiles()
    return u

def test_profiles_ran(therapists, db):
    ids = [u.id for k, u in therapists.items()]
    cache_users = db.query(M.CacheUser)\
        .filter(M.CacheUser.user_id.in_(ids))\
        .all()
    assert len(cache_users) == 3  # exclude therapist_na
    users = db.query(M.User)\
        .filter(M.User.id.in_([cu.user_id for cu in cache_users]))\
        .all()
    for u in users:
        assert u.ai_ran is True

def test_matches_made(db, main_uid):
    user = db.query(M.User).get(main_uid)
    matches = db.execute("""
    select u.email, pm.score from profile_matches pm
    inner join users u on pm.match_id=u.id
    """).fetchall()
    assert len(matches) == 3
    matches = Box({
        m.email.split('@')[0]: m
        for m in matches
    })
    # cosine DISTANCES; smaller is better
    assert matches.therapist_good.score < matches.therapist_bad.score
    assert matches.therapist_best.score < matches.therapist_good.score
