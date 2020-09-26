import pytest

def test_tags(client, u):
    res = client.get("/tags", **u.user.header)
    assert res.status_code == 200
    res = res.json()
    assert len(res) > 0
    assert res[0]['main']
    assert res[0]['name'] == 'Main'
    for r in res:
        assert r['selected']

def test_not_shared(client, u):
    res = client.get(f"/tags?as_user={u.user.id}", **u.other.header)
    # assert res.status_code == 401
    res = res.json()
    assert len(res) == 0

# user.tag1 setup & shared in conftest.py
def test_shared_therapist(client, u):
    res = client.get(f"/tags?as_user={u.user.id}", **u.therapist.header)
    assert res.status_code == 200
    res = res.json()
    assert len(res) == 1
    assert res[0]['main']
    assert res[0]['selected']
    assert res[0]['name'] == 'Main'


# user.tag2 setup & shared in conftest.py
def test_shared_friend(client, u):
    res = client.get(f"/tags?as_user={u.user.id}", **u.friend.header)
    assert res.status_code == 200
    res = res.json()
    assert len(res) == 1
    assert res[0]['main']
    assert res[0]['selected']
    assert res[0]['name'] == 'Fun'


def test_selections(client, u):
    tags = list(u.user.tag1.keys())
    t1 = client.post('/tags', json=dict(name='Tag1'), **u.user.header)
    t2 = client.post('/tags', json=dict(name='Tag2'), **u.user.header)
    t3 = client.post('/tags', json=dict(name='Tag3'), **u.user.header)
    for t in [t1, t2, t3]:
        assert t.status_code == 200
        t = t.json()
        tags.append(t['id'])

    # Share with therapist
    # TODO add get/:id route?
    shares = client.get('/shares', **u.user.header)
    assert shares.status_code == 200
    shares = shares.json()
    share = next(iter([
        s for s in shares
        if s['email'] == u.therapist.email and s['user_id'] == u.user.id
    ]))
    assert share['id']
    tagsObj = {**u.user.tag1, **{t: True for t in tags}}
    data = {**share, **{'tags': tagsObj}}
    res = client.put(f"/shares/{share['id']}", json=data, **u.user.header)
    assert res.status_code == 200

    def toggle(idx, expected, as_user=False):
        as_user = f"?as_user={u.user.id}" if as_user else ""
        header = u.therapist.header if as_user else u.user.header
        if idx > -1:
            client.post(f"/tags/{tags[idx]}/toggle{as_user}", **header)
        res = client.get(f"/tags{as_user}", **header)
        assert res.status_code == 200
        assert sum([
            1 for r in res.json()
            if r['selected']
        ]) == expected

    toggle(-1, 5)
    toggle(-1, 4, True)

    toggle(0, 4)
    toggle(2, 3)
    toggle(2, 4)
    toggle(0, 5)

    toggle(-1, 4, True)
    toggle(0, 3, True)
    toggle(1, 2, True)
    toggle(1, 3, True)

    toggle(-1, 5)
    toggle(2, 4)
