import pytest
import json
from search import main as search
from document_store import CustomDocumentStore
from os.path import exists


@pytest.fixture(scope="module")
def mock_data():
    if exists('./mock_entries.json'):
        with open("./mock_entries.json", "r") as f:
            return json.loads(f.read())

    import re
    from uuid import uuid4
    from bs4 import BeautifulSoup
    from urllib.request import urlopen

    final = []
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
                content=para,
                name=f"{topic}{i}",
                obj_id=str(uuid4()),
                parent_id=parent_id,
                obj_type="entry"
            )
            objects.append(doc)
    with open("mock_entries.json", "w") as f:
        f.write(json.dumps(objects))
    document_store = CustomDocumentStore()
    document_store.upsert(objects, "Object")
    document_store.upsert(objects, "Books")

    return objects


def test_no_query(mock_data):
    res = search({
        "ids": [],
        "query": None
    }, {})
    assert not res['ids']
    assert not res['answer']


def test_filtered_query(mock_data):
    N = 10
    res = search({
        "ids": [m['obj_id'] for m in mock_data[:N]],
        "query": "cognitive behavioral"
    }, {})
    assert len(res['ids']) < N
    assert not res['answer']


def test_ask(mock_data):
    res = search({
        "ids": [m['obj_id'] for m in mock_data],
        "query": "what is cognitive behavioral therapy?"
    }, {})
    assert res['answer']
    print(res['answer'])
