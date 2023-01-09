import pytest
from store.cluster import cluster, themes
from store.tests.init_test_data import init_test_data
from store.store import embed


@pytest.fixture(scope="module")
def mock_data():
    return init_test_data()

def test_cluster(mock_data):
    texts = [m['text'] for m in mock_data]
    embeddings = embed(texts)
    clusters = themes(texts, embeddings, algo="agglomorative")
    print(clusters)
