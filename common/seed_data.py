import common.models as M
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

MAIN_USER = 'tylerrenelle@gmail.com'
MAIN_GROUP = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'


def seed_item(db, model, obj, idx=None):
    s = psql.insert(model.__table__).values(**obj)
    if idx:
        s = s.on_conflict_do_nothing(index_elements=[idx])
    else:
        s = s.on_conflict_do_nothing(constraint=model.__table__.primary_key)
    db.execute(s)
    db.commit()


def seed_data(db):
    version = db.query(M.Misc).get('version')
    if version: return

    seed_item(db, M.Misc, dict(key='version', val='1'))
    seed_item(db, M.User, dict(email=MAIN_USER, is_superuser=True), 'email')

    uid = db.query(M.User.id).filter_by(email=MAIN_USER).scalar()
    seed_item(db, M.Group, dict(
        id=MAIN_GROUP,
        owner=uid,
        title='Gnothi',
        text_short='Official Gnothi group. A place to chat generally about mental health.',
        privacy=M.GroupPrivacy.public
    ))
