import pytest, re
from pprint import pprint
import common.models as M
from app.books import run_books
import logging
logger = logging.getLogger(__name__)

def test_books(main_uid, db):
    run_books(main_uid)
    res = db.query(M.Book)\
        .join(M.Bookshelf, M.Bookshelf.book_id == M.Book.id)\
        .filter(M.Bookshelf.user_id == main_uid, M.Bookshelf.shelf == 'ai')\
        .all()
    assert len(res) > 0
    titles = [b.title for b in res]
    pprint(titles)
    assert re.search("(cognitive|cbt|virtual)", ";".join(titles))

