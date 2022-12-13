import json
from docstore.main import main
from os.path import exists
from common.fixtures import articles
from uuid import uuid4
import datetime


def _load_data():
    if exists('./mock_entries.json'):
        with open("./mock_entries.json", "r") as f:
            return json.loads(f.read())
    return False
def _download_data():
    docs = articles("paragraph", "md")
    entries = []
    user_id = str(uuid4())
    for title, text in docs.items():
        entries.append(dict(
            text=text,
            created_at=datetime.datetime.now().isoformat(),
            title=title,
            id=str(uuid4()),
            user_id=user_id
        ))
    with open("mock_entries.json", "w") as f:
        f.write(json.dumps(entries))
    return entries

def init_test_data(reinit=False):
    data = _load_data()
    if not data:
        data = _download_data()
        reinit = True

    if reinit:
        # assign new user_id / entry_id so we have fresh start
        for d in data:
            main({
                "event": "upsert",
                "data": d
            }, {})
    return data

if __name__ == "__main__":
    init_test_data(True)
