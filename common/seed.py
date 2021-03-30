import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

MAIN_USER = 'tylerrenelle@gmail.com'
ADMIN_EMAIL = 'admin@gnothi.com'
ADMIN_ID = '484b32c8-6463-49c5-83ca-75340f0abdc3'
GROUP_ID = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'


def seed_data(db, M):
    if not db.query(M.Misc.val).filter_by(key='version').scalar():
        db.add(M.Misc(key='version', val='1'))
        db.commit()
    if not db.query(M.User).get(ADMIN_ID):
        db.add(M.User(id=ADMIN_ID, email=ADMIN_EMAIL, is_superuser=True))
        db.commit()

    if not db.query(M.Group).get(GROUP_ID):
        db.add(M.Group(
            id=GROUP_ID,
            owner=ADMIN_ID,
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
