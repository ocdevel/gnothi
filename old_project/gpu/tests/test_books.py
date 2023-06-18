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
    assert re.search("(cognitive|cbt|virtual)", ";".join(titles), re.IGNORECASE)

    def get_ids(sql):
        res = db.execute(sql)
        db.commit()
        return [r.id for r in res]

    # Now make sure valued books don't get wiped out next run
    amz_ids = get_ids("""
    update books set amazon='xyz' 
    where id in (select id from books order by id asc limit 5) 
    returning id
    """)

    like_ids = get_ids("""
    update bookshelf set shelf='like' 
    where book_id in (select id from books order by id desc limit 3) 
    returning book_id as id
    """)

    # "remove" button sets value=0, so make sure it's preserved nonetheless
    remove_ids = get_ids("""
    update bookshelf set shelf='remove'
    where book_id in (select id from books order by id desc limit 3 offset 3) 
    returning book_id as id
    """)

    ct = db.execute("""
    update users set last_books=null;
    select count(*) ct from books;
    """).fetchone().ct

    run_books(main_uid)
    books = get_ids("select id from books")
    # ensure amz books kept
    for arr in [amz_ids, like_ids, remove_ids]:
        for id in arr:
            assert id in books
    # make sure we got rid of the last batch, aka didn't double the book count
    assert len(books) < ct*2
    assert len(books) >= ct

    shelf = get_ids("select book_id as id from bookshelf")
    for arr in [like_ids, remove_ids]:
        for id in arr:
            assert id in shelf
