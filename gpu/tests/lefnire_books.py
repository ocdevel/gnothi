from app.books import run_books
import common.models as M
from common.database import session
from sqlalchemy import text
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('target', help='lefnire|all')
args = parser.parse_args()

with session() as sess:
    if args.target == 'lefnire':
        user = sess.query(M.User).filter(M.User.email == 'tylerrenelle@gmail.com').first()
        users = [user]
    else:
        users = sess.execute(text("""
        with entries_ as (
            select count(*) ct, user_id 
            from entries group by user_id
        )
        select user_id as id from entries_ where ct>2
        """)).fetchall()
    for u in users:
        uid = u.id
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
