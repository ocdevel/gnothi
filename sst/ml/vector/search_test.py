# TODO having some Pycharm issues with this being a pytest. Just running as-is for now

REINIT_DATA = False

import pytest
import json
from main import main
from document_store import store
from os.path import exists

def _load_data():
    if exists('./mock_entries.json'):
        with open("./mock_entries.json", "r") as f:
            return json.loads(f.read())
    return False
def _download_data():
    import re
    from uuid import uuid4
    from bs4 import BeautifulSoup
    from urllib.request import urlopen

    parent_id = str(uuid4())
    objects = []
    articles = [
        ['cbt', "https://en.wikipedia.org/wiki/Cognitive_behavioral_therapy"],
        ['vr', "https://en.wikipedia.org/wiki/Virtual_reality"],
        ['ai', "https://en.wikipedia.org/wiki/Artificial_intelligence"]
    ]
    for [topic, url] in articles:
        html = urlopen(url)
        soup = BeautifulSoup(html, 'html.parser')
        paras = []
        for para in soup.find(id="mw-content-text").find_all('p'):
            para = para.get_text()
            para = para.replace('\n', ' ')
            para = re.sub(r"\[[0-9]+\]", "", para)
            if len(para) < 10:
                continue
            # para = re.sub(r"\[[0-9]*\]", "", para)
            if len(paras) == 0:
                paras.append(para)
            elif len(para) < 100:
                paras[len(paras) - 1] += para
            else:
                paras.append(para)
        for i, para in enumerate(paras):
            doc = dict(
                text=para,
                title=f"{topic}{i}",
                id=str(uuid4()),
            )
            objects.append(doc)
    with open("mock_entries.json", "w") as f:
        f.write(json.dumps(objects))
    return objects

# @pytest.fixture(scope="module")
# def mock_data():
data = _load_data()
if not data:
    data = _download_data()
    REINIT_DATA = True
mock_data = data

if REINIT_DATA:
    main({
        "event": "init",
        "data": {}
    }, {})
    main({
        "event": "upsert",
        "data": [d for d in data]
    }, {})

# def test_no_query(mock_data):
res = main({
    "event": "search",
    "data": {
        "ids": [],
        "query": None
    }
}, {})
assert not res['ids']
assert not res['answer']


# # def test_filtered_query(mock_data):
# N = 10
# res = main({
#     "event": "search",
#     "data": {
#         "ids": [m['id'] for m in mock_data[:N]],
#         "query": "cognitive behavioral"
#     }
# }, {})
# assert len(res['ids']) < N
# assert not res['answer']


# def test_ask(mock_data):
res = main({
    "event": "search",
    "data": {
        "ids": [m['id'] for m in mock_data],
        "query": "what is cognitive behavioral therapy?"
    }
}, {})
assert res['answer']
print(res['answer'])
