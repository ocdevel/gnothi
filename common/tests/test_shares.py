import pytest
from box import Box
import common.database as D
import common.models as M

@pytest.fixture
def tags(db, u):
    t = Box({})
    for k, user in u.items():
        t1 = M.Tag(name=f"tag_{k}_user")
        t2 = M.Tag(name=f"tag_{k}_group")
        t[k] = dict(user=t1, group=t2)
        db.add_all([t1, t2])
        db.commit()
        db.refresh(t1);db.refresh(t2)
    return t


@pytest.fixture
def with_entries(db, u, tags):
    for k, user in u.items():
        t = tags[k]
        for i in range(3):
            e = M.Entry(text=f"entry_{k}_user", user=user)
            et = M.EntryTag(tag=t.user, entry=e)
            db.add(et)
        for i in range(2):
            e = M.Entry(text=f"entry_{k}_group", user=user)
            et = M.EntryTag(tag=t.group, entry=e)
            db.add(et)
    db.commit()


def test_private(db, u, with_entries):
    for k, user in u.items():
        entries = db.query(M.Entry).filter_by(user_id=user.id).all()
        assert len(entries) == 5
        for e in entries:
            assert e.text.startswith(f"entry_{k}")


@pytest.fixture
def with_groups(db, u):
    """
    user1->group1
    user2->group1, group2

    user5->group2
    """
    g1 = M.Group(owner=u.user1, title=f"group1", text_short=f"text_short_group1")
    g2 = M.Group(owner=u.user2, title=f"group2", text_short=f"text_short_group2")
    db.add(M.UserGroup(user=u.user1, group=g1))
    db.add(M.UserGroup(user=u.user2, group=g1))
    db.add(M.UserGroup(user=u.user2, group=g2))
    db.add(M.UserGroup(user=u.user5, group=g2))
    db.commit()
    return Box(g1=g1, g2=g2)


def share_users(db, u, tags, users=False, groups=False):
    """
    user1-> [user2] [group1]
    user2-> None [group1 group2]

    user3-> [user4] None
    user4-> [user3] None

    user5-> None [group2]
    """
    s = M.Share(user=u.user1)
    db.add(M.ShareTag(share=s, tag=tags.user1.user))
    if users:
        db.add(M.ShareUser(share=s, obj=u.user2))
    if groups:
        db.add(M.ShareGroup(share=s, obj=groups.g1))

    s = M.Share(user=u.user3)
    db.add(M.ShareTag(share=s, tag=tags.user3.user))
    if users:
        db.add(M.ShareUser(share=s, obj=u.user4))

    s = M.Share(user=u.user4)
    db.add(M.ShareTag(share=s, tag=tags.user4.user))
    if users:
        db.add(M.ShareUser(share=s, obj=u.user3))

    db.commit()

# @pytest.mark.parametrize("user", [
#     Box(k='user1', users=True, groups=False, users_ct=0, groups_ct=0),
#     Box(k='user1', users=True, groups=True, users_ct=0, groups_ct=4),
#     Box(k='user2', users=True, groups=False, users_ct=3, groups_ct=0),
#     Box(k='user2', users=True, groups=True, users_ct=3, groups_ct=4),
#     Box(k='user3', users=True, groups=True, users_ct=3, groups_ct=4),
# ])


def test_user_shares(db, u, with_shared):
    # user1 private
    res = M.Entry.snoop(db, u.user1.id, None).all()
    assert len(res) == 5
    for e in res:
        assert e.text.startswith(f"entry_user1")

    # user1->user2
    res = M.Entry.snoop(db, u.user1.id, u.user2.id).all()
    assert len(res) == 0

    # user2->user1
    res = M.Entry.snoop(db, u.user2.id, u.user1.id).all()
    assert len(res) == 3  # 3 shared entry-tags
    for e in res:
        assert e.text.startswith(f"entry_user1")


def test_ingress(db, u, with_shared):
    res = M.Share.ingress(db, u.user1.id)
    assert len(res) == 0

    res = M.Share.ingress(db, u.user2.id)
    assert len(res) == 1
    assert res[0]['user'].id == u.user1.id


def test_egress(db, u, with_shared):
    res = M.Share.egress(db, u.user1.id)
    assert len(res) == 1
    assert res[0]['users'][0] == u.user2.email

    res = M.Share.egress(db, u.user2.id)
    assert len(res) == 0
