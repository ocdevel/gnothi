import pytest
import common.models as M

@pytest.fixture(scope='module')
def entry(db):
    # titles encrypted, can't search
    # return db.query(M.Entry).filter_by(title='vr_1').first()
    return db.query(M.Entry).first()


def test_entries_ran(entry):
    assert entry.title_summary
    assert entry.text_summary


def test_title(entry):
    assert entry.title_summary[:20] != entry.text_summary[:20]
    assert entry.title_summary[:20] != entry.text[:20]
