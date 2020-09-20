import pytest, re
from pprint import pprint
import common.models as M
from app.themes import themes
import logging
logger = logging.getLogger(__name__)

def test_themes_100(db):
    entries = db.query(M.Entry) \
        .with_entities(M.Entry.id, M.Entry.title) \
        .limit(100) \
        .all()
    eids = [e.id for e in entries]

    res = themes(eids)
    assert len(res['terms']) > 0
    assert len(res['themes']) > 0
    terms = ', '.join(res['terms'])
    found = re.search("(virtual|vr)", terms)
    # be sure to call with pytest -s
    print("Themes")
    pprint(res)
    assert found


def test_themes_all(db):
    entries = db.query(M.Entry) \
        .with_entities(M.Entry.id, M.Entry.title) \
        .all()
    eids = [e.id for e in entries]

    # FIXME there's a paras/clean/vectors count mismatch. paras specifically
    # has more len() than the others, a bug in fixtures, or in clean_text?
    themes(eids)
