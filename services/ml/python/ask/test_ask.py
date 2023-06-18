import pytest
from ask.main import main
from store.tests.init_test_data import init_test_data


@pytest.fixture(scope="module")
def mock_data():
    data = init_test_data()
    return {
        "user_id": data[0]['user_id'],
        "entry_ids": [d['id'] for d in data]
    }

def test_not_question(mock_data):
    res = main({
        "query": "hello",
        **mock_data
    }, {})
    assert not res['answer']


def test_question(mock_data):
    res = main({
        "query": "what is cognitive behavioral therapy?",
        **mock_data
    }, {})
    assert res['answer']
    print(res)
