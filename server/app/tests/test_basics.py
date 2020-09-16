def test_jobs_status(client, u):
    res = client.get('/jobs-status', **u.user.header)
    assert res.status_code == 200
    assert res.json() == 'on'
