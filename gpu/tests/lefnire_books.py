from app.books import run_books
import common.models as M
from common.database import session
from sqlalchemy import text

with session() as sess:
    uid = sess.query(M.User).filter(M.User.email=='tylerrenelle@gmail.com').first().id
    uid_ = dict(uid=uid)
    sess.execute(text("update users set last_books=null where id=:uid"), uid_)
    sess.commit()
    run_books(uid)
    res = sess.execute(text("""
    select s.shelf, b.title
    from bookshelf s
    inner join books b on b.id=s.book_id and s.user_id=:uid and s.shelf='ai'
    """), uid_).fetchall()
    for r in res:
        print(r.shelf, r.title)
