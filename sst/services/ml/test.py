from .fixtures import reinit_weaviate, docs
from .insights import main, client

#pytest -rP
def test_weaviate():
    # reinit_weaviate(client)
    print(len(docs))
    res = main({}, {})
