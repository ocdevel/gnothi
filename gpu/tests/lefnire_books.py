from app.books import run_books
import common.models as M
from common.database import session

with session() as sess:
    user_id = sess.query(M.User).filter(M.User.email=='tylerrenelle@gmail.com').first().id
    run_books(user_id)
    shelf = sess.query(M.Bookshelf)\
        .filter(M.Bookshelf.user_id==user_id)\
        .order_by(M.Bookshelf.shelf.asc())\
        .all()
    for s in shelf:
        print(s.shelf, s.title)
