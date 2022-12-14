import pytest
from store.main import main
import datetime
from uuid import uuid4
from store.store import EntryStore

entry = """
# This is the title
This is an entry in markdown. It should be split into multiple paragraphs
* list items
* should be
* combined into
* one.

## A second section
The result should be 2 paragraphs, 1 entry. *bold* and _italic_ items removed, etc. The final result should have summary, themes, and emotion.
"""

def test_add_entry():
    user_id = str(uuid4())
    entry_id = str(uuid4())
    res = main({
        "event": "upsert",
        "data": {
            "id": entry_id,
            "created_at": datetime.datetime.now(),
            "user_id": user_id,
            "text": entry
        }
    }, {})
    print(res)
    assert(res['title'])
    assert(res['summary'])
    assert(res['keywords'])
    assert(res['emotion'])

    store = EntryStore(user_id)
    df = store.load(None)
    assert df[df.obj_type == 'entry'].shape[0] == 1
    assert df[df.obj_type == 'paragraph'].shape[0] > 1
    assert df[df.obj_type == 'user'].shape[0] == 1
