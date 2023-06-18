import pdb
import pytest
from datetime import datetime
from dateutil.parser import parse
import dateutil

def test_edit_date(client, post_entry, u, db):
    tz = dateutil.tz.gettz("America/Los_Angeles")
    eid = post_entry()
    entry = client.get(f"/entries/{eid}", **u.user.header).json()
    fmt = '%Y-%m-%d'
    assert parse(entry['created_at']).strftime(fmt) == \
           datetime.now().astimezone(tz).strftime(fmt)

    d = '2019-12-01'
    entry = dict(
        title=entry['title'],
        text=entry['text'],
        tags=u.user.tag1,
        created_at=d
    )
    entry = client.put(f"/entries/{eid}", json=entry, **u.user.header).json()
    assert parse(entry['created_at']).strftime(fmt) == d
