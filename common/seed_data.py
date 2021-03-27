import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

MAIN_USER = 'tylerrenelle@gmail.com'
MAIN_GROUP = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'

def seed_data(db, M):
    if not db.query(M.Misc.val).filter_by(key='version').scalar():
        db.add(M.Misc(key='version', val='1'))
        db.commit()
    if not db.query(M.User.id).filter_by(email=MAIN_USER).scalar():
        db.add(M.User(email=MAIN_USER, is_superuser=True))
        db.commit()

    if not db.query(M.Group).get(MAIN_GROUP):
        uid = db.query(M.User.id).filter_by(email=MAIN_USER).scalar()
        db.add(M.Group(
            id=MAIN_GROUP,
            owner=uid,
            title='Gnothi',
            text_short='Official Gnothi group. A place to chat generally about mental health.',
            text_long='Official Gnothi group. A place to chat generally about mental health.',
            privacy=M.GroupPrivacy.public
        ))
        db.commit()


if __name__ == '__main__':
    from common.database import with_db
    import common.models as M
    with with_db() as db:
        seed_data(db, M)
