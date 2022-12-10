import pytest
import json
from docstore.main import main
from os.path import exists
from common.fixtures import articles
from docstore.tests.init_test_data import init_test_data

@pytest.fixture(scope="module")
def mock_data():
    return init_test_data()

def test_no_query(mock_data):
    res = main({
        "event": "search",
        "data": {
            "ids": [],
            "query": None
        }
    }, {})
    assert not res['ids']
    assert not res['answer']


def test_filtered_query(mock_data):
    N = 10
    res = main({
        "event": "search",
        "data": {
            "ids": [m['id'] for m in mock_data[:N]],
            "query": "cognitive behavioral"
        }
    }, {})
    assert len(res['ids']) < N
    assert not res['answer']

def test_ask(mock_data):
    res = main({
        "event": "search",
        "data": {
            "ids": [m['id'] for m in mock_data],
            "query": "what is cognitive behavioral therapy?"
        }
    }, {})
    assert res['answer']
    print(res['answer'])
