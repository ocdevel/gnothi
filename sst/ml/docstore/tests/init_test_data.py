import json
from docstore.main import main
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

def init_test_data(reinit=False):
    data = _load_data()
    if not data:
        data = _download_data()
        reinit = True

    if reinit:
        main({
            "event": "init",
            "data": {}
        }, {})
        for d in data:
            main({
                "event": "upsert",
                "data": d
            }, {})
    return data

if __name__ == "__main__":
    init_test_data(True)
