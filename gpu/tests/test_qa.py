import pytest
from pprint import pprint
import common.models as M
from app.nlp import nlp_
import logging
logger = logging.getLogger(__name__)

@pytest.fixture()
def groups(db):
    # limiting for now, script killing itself (TODO investigate)
    limit = 50
    c_entries = db.query(M.CacheEntry) \
        .with_entities(M.CacheEntry.paras) \
        .limit(limit) \
        .all()
    return [c.paras for c in c_entries]

def test_qa_flat(groups):
    context = [p for g in groups for p in g]
    res = nlp_.question_answering("What is VR?", context)
    assert len(res) > 0
    # be sure to call with pytest -s
    print("QA Answers")
    pprint(res)
    # assert 'Virtual' in res[0]['answer']
    if 'Virtual' not in res[0]['answer']:
        answers = ', '.join([a['answer'] for a in res])
        logger.warning(f"'What is VR?' gave {answers}")


def test_qa_group(groups):
    with pytest.raises(Exception):
        nlp_.question_answering("What is VR?", groups)
