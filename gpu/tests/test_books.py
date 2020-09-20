import pytest, re
from pprint import pprint
import common.models as M
from app.books import run_books
import logging
logger = logging.getLogger(__name__)

def test_books(main_uid, db):
    run_books(main_uid)
    res = db.query(M.Bookshelf)\
        .filter_by(user_id=main_uid, shelf='ai')\
        .all()
    assert len(res) > 0
