def test_jobs_status(client, u):
    res = client.get('/jobs-status')
    assert res.status_code == 200
    assert res.json() == 'on'
