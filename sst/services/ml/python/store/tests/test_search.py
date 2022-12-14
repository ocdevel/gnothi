import pytest
from store.main import main
from store.tests.init_test_data import init_test_data

@pytest.fixture(scope="module")
def mock_data():
    return init_test_data()

def test_no_query(mock_data):
    user_id = mock_data[0]['user_id']
    res = main({
        "event": "search",
        "data": {
            "user_id": user_id,
            "entry_ids": [],
            "query": None
        }
    }, {})
    assert not res['ids']
    assert not res['search_mean']
    assert not res['clusters']


def test_filtered_query(mock_data):
    user_id = mock_data[0]['user_id']
    N = 20
    res = main({
        "event": "search",
        "data": {
            "user_id": user_id,
            "entry_ids": [m['id'] for m in mock_data[:N]],
            "query": "cognitive behavioral"
        }
    }, {})
    assert len(res['ids']) > 1 and len(res['ids']) < N
    assert len(res['search_mean']) == 384
    assert len(res['clusters'])
    assert len(res['clusters'][0]) > 1
