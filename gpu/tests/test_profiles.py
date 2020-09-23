import pytest
from uuid import uuid4
from box import Box
import common.models as M
from common.fixtures import fixtures
from app.nlp import nlp_

e = fixtures.entries
vr1, vr2 = e.Virtual_reality_0.text, e.Virtual_reality_1.text
cbt1, cbt2 = e.Cognitive_behavioral_therapy_0.text, e.Cognitive_behavioral_therapy_1.text

@pytest.fixture(scope='module')
def therapists(db):
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
    nlp_.profiles()
    return u

def test_profiles_ran(therapists, db, main_uid):
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
