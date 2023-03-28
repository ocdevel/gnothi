import enum, re, datetime, shortuuid
from typing import List
from pydantic import UUID4

from data.db import Base, with_session
from utils.errors import AccessDenied, GroupDenied, GnothiException
from data.seed import ADMIN_ID, GROUP_ID as MAIN_GROUP

import sqlalchemy as sa
from sqlalchemy import func
import sqlalchemy.orm as orm
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy_utils.types.encrypted.encrypted_type import StringEncryptedType, FernetEngine
from sqlalchemy.orm import Session
import petname

from settings import settings, logger


# https://dev.to/zchtodd/sqlalchemy-cascading-deletes-8hk
parent_cascade = dict(cascade="all, delete", passive_deletes=True)
child_cascade = dict(ondelete="cascade")

# Note: using sa.sa.Unicode for all Text/Varchar columns to be consistent with sqlalchemy_utils examples. Also keeping all
# text fields unlimited (no varchar(max_length)) as Postgres doesn't incur penalty, unlike MySQL, and we don't know
# how long str will be after encryption.
def Encrypt(Col=sa.Unicode, array=False, **args):
    enc = StringEncryptedType(Col, settings.flask_key, FernetEngine)
    if array: enc = psql.ARRAY(enc)
    return sa.Column(enc, **args)


# TODO should all date-cols be index=True? (eg sorting, filtering)
def DateCol(default=True, update=False, **kwargs):
    args = {}
    # Using utcnow here caused double utc (add more hours), why? Just using now() for now,
    # and assuming you're DB server is set on UTC
    if default: args['server_default'] = sa.text("now()")
    if update: args['onupdate'] = sa.text("now()")
    return sa.Column(sa.TIMESTAMP(timezone=True), index=True, **args, **kwargs)


def IDCol():
    return sa.Column(psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()"))


def FKCol(fk, **kwargs):
    return sa.Column(psql.UUID(as_uuid=True), sa.ForeignKey(fk, **child_cascade), **kwargs)


class AuthOld(Base):
    __tablename__ = 'auth_old'

    id = FKCol('users.id', index=True, primary_key=True)
    email = sa.Column(sa.String(length=320), unique=True, index=True, nullable=False)
    hashed_password = sa.Column(sa.String(length=72), nullable=False)
    updated_at = DateCol()


class User(Base):
    updated_at = DateCol(update=True)

    affiliate = sa.Column(sa.Unicode, sa.ForeignKey('codes.code'))

    # Relationships
    entries = orm.relationship("Entry", order_by='Entry.created_at.desc()', **parent_cascade)
    field_entries = orm.relationship("FieldEntry", order_by='FieldEntry.created_at.desc()', **parent_cascade)
    fields = orm.relationship("Field", order_by='Field.created_at.asc()', **parent_cascade)
    people = orm.relationship("Person", order_by='Person.name.asc()', **parent_cascade)
    shares = orm.relationship("Share", **parent_cascade)
    tags = orm.relationship("Tag", order_by='Tag.name.asc()', **parent_cascade)
    groups = orm.relationship("Group", secondary="users_groups")

    @staticmethod
    def snoop(db, viewer, sid=None):
        vid = viewer.id
        if not sid or vid == sid:
            return viewer, False
        res = (
            db.query(User, Share)
            .select_from(User)
            .join(Share)
            .join(ShareUser, sa.and_(
                Share.id == ShareUser.share_id,
                Share.user_id == sid,
                ShareUser.obj_id == vid,
            ))
            .first()
        )
        if not res:
            return viewer, False
        as_user = res[0]
        as_user.share_data = res[1]
        return as_user, True

    def profile_to_text(self):
        txt = ''
        if self.gender:
            txt += f"I am {self.gender}. "
        if self.orientation and not re.match("straight", self.orientation, re.IGNORECASE):
            txt += f"I am {self.orientation}. "
        if self.bio:
            txt += self.bio
        for p in self.people:
            whose = "" if "'" in p.relation.split(' ')[0] else "my "
            txt += f"{p.name} is {whose}{p.relation}. "
            if p.bio: txt += p.bio
            # if p.issues: txt += f" {p.name} has these issues: {p.issues} "
        txt = re.sub(r'\s+', ' ', txt)
        # print(txt)
        return txt

    @staticmethod
    def last_checkin(db):
        return db.execute(f"""
        select extract(
            epoch FROM (now() - max(updated_at))
        ) / 60 as mins
        from users limit 1 
        """).fetchone().mins or 99

    @staticmethod
    def tz(db, user_id):
        return db.execute(sa.text(f"""
        select coalesce(timezone, 'America/Los_Angeles') as tz
        from users where id=:user_id
        """), dict(user_id=user_id)).fetchone().tz


class Entry(Base):
    updated_at = DateCol(update=True)
    text = Encrypt(sa.Unicode, nullable=False)
    # no_ai = sa.Column(sa.Boolean, server_default='false')
    # ai_ran = sa.Column(sa.Boolean, server_default='false')

    # Generated
    # title_summary = Encrypt()
    # text_summary = Encrypt()
    # sentiment = Encrypt()

    user_id = FKCol('users.id', index=True)
    entry_tags_ = orm.relationship("EntryTag", **parent_cascade)

    user = orm.relationship("User")

    # share_tags = orm.relationship("EntryTag", secondary="shares_tags")

    @property
    def entry_tags(self):
        return {str(t.tag_id): True for t in self.entry_tags_}

    @staticmethod
    def snoop(
        db: Session,
        vid: UUID4,
        sid: UUID4,
        entry_id: UUID4 = None,
        group_id: UUID4 = None,
        order_by=None,
        tags: List[UUID4] = None,
        days: int = None,
        for_ai: bool = False
    ):
        snooping = sid and (vid != sid)
        if snooping:
            q = (db.query(Entry)
                 .join(EntryTag)
                 .join(ShareTag, ShareTag.tag_id == EntryTag.tag_id)
                 .join(Share, ShareUser)
                 .filter(ShareUser.obj_id == vid, Share.user_id == sid))
            # # TODO use ORM partial thus far for this query command, not raw sql
            # sql = f"""
            # update shares set last_seen=now(), new_entries=0
            # where email=:email and user_id=:uid
            # """
            # db.execute(sa.text(sql), dict(email=viewer_email, uid=target_id))
            # db.commit()

        elif group_id:
            q = (
                db.query(Entry)
                .join(EntryTag)
                .join(ShareTag, ShareTag.tag_id == EntryTag.tag_id)
                .join(ShareGroup, sa.and_(
                    ShareGroup.share_id == ShareTag.share_id,
                    ShareGroup.obj_id == group_id
                ))
                .join(UserGroup, sa.and_(
                    UserGroup.group_id == ShareGroup.obj_id,
                    UserGroup.user_id == vid
                ))
            )
        else:
            q = db.query(Entry).filter(Entry.user_id == vid)

        if entry_id:
            q = q.filter(Entry.id == entry_id)

        if for_ai:
            q = q.filter(Entry.no_ai.isnot(True))

        if tags:
            if not snooping:
                # already joined otherwise
                q = q.join(EntryTag, Tag)
            q = q.filter(EntryTag.tag_id.in_(tags))

        if days:
            now = datetime.datetime.utcnow()
            x_days = now - datetime.timedelta(days=days)
            # build a beginning-to-end story
            q = q.filter(Entry.created_at > x_days)
            order_by = Entry.created_at.asc()

        if order_by is None:
            order_by = Entry.created_at.desc()
        return q.order_by(order_by)

    @staticmethod
    def run_models(db, entry):
        entry.ai_ran = False
        if entry.no_ai:
            entry.title_summary = entry.text_summary = entry.sentiment = None
            return

        # Run summarization/sentiment in background thread, so (a) user can get back to business;
        # (b) if AI server offline, wait till online
        entry.title_summary = "🕒 AI is generating a title"
        entry.text_summary = "🕒 AI is generating a summary"
        # not used in nlp, but some other meta stuff
        data_in = dict(args=[str(entry.id)])
        Job.create_job(db, user_id=entry.user_id, method='entries', data_in=data_in)


class NoteTypes(enum.Enum):
    label = "label"
    note = "note"
    resource = "resource"
    comment = "comment"


class Note(Base):
    __tablename__ = 'notes'
    id = IDCol()
    created_at = DateCol()
    entry_id = FKCol('entries.id', index=True)
    user_id = FKCol('users.id', index=True)
    type = sa.Column(sa.Enum(NoteTypes), nullable=False, default=NoteTypes.comment.value)
    text = Encrypt(sa.Unicode, nullable=False)
    private = sa.Column(sa.Boolean, server_default='false')

    user = orm.relationship("User")
    entry = orm.relationship("Entry")

    @staticmethod
    def add_note(db, vid, data):
        eid = data.entry_id
        db.add(Note(
            user_id=vid,
            entry_id=eid,
            type=data.type,
            text=data.text,
            private=data.private
        ))
        db.commit()
        db.execute(sa.text("""
        update entries e set n_notes=(select count(*) from notes where entry_id=:eid)
        where e.id=:eid
        """), dict(eid=eid))
        return NoteNotif.create_notifs(db, eid)

    @staticmethod
    def snoop(
        db: Session,
        vid: UUID4,
        entry_id: UUID4 = None,
        group_id: UUID4 = None
    ):
        mine = db.query(Note.user_id).filter(Note.user_id == vid)
        if entry_id:
            mine = mine.filter(Note.entry_id == entry_id)
        can_view = (
            db.query(Note.user_id)
            .filter(Note.private.is_(False))
            .join(EntryTag, Note.entry_id == EntryTag.entry_id)
            .join(ShareTag, EntryTag.tag_id == ShareTag.tag_id)
        )
        if group_id:
            can_view = (
                can_view.join(ShareGroup, sa.and_(
                    ShareTag.share_id == ShareGroup.share_id,
                    ShareGroup.obj_id == group_id,
                )).join(UserGroup, sa.and_(
                    UserGroup.user_id == vid,
                    UserGroup.group_id == group_id
                ))
            )
        else:
            can_view = (
                can_view.join(ShareUser, sa.and_(
                    ShareTag.share_id == ShareUser.share_id,
                    ShareUser.obj_id == vid,
                )).join(UserGroup, sa.and_(
                    UserGroup.user_id == vid,
                    UserGroup.group_id == group_id
                ))
            )

        if entry_id:
            can_view = can_view.filter(Note.entry_id == entry_id)

        # TODO if fetching all, just fetch counts to save bandwidth
        cte = mine.union(can_view).subquery()

        res = db.query(Note).join(cte, Note.user_id.in_(cte))\
            .order_by(Note.created_at.asc())\
            .all()

        obj = {}
        for r in res:
            eid = str(r.entry_id)
            if eid not in obj: obj[eid] = []
            obj[eid].append(r)
        return obj

class Field(Base):
    user = orm.relationship("User")

    @staticmethod
    def update_avg(db, fid):
        db.execute(sa.text("""
        update fields set avg=(
            select avg(value) from field_entries2 fe
            where fe.field_id=:fid and fe.value is not null
        ) where id=:fid
        """), dict(fid=fid))
        db.commit()

    @staticmethod
    def get_history(db, fid):
        FE = FieldEntry
        return db.query(FE)\
            .with_entities(FE.value, FE.created_at)\
            .filter(FE.field_id == fid, FE.value.isnot(None), FE.created_at.isnot(None))\
            .order_by(FE.created_at.asc())\
            .all()


class FieldEntryOld(Base):
    """
    This is a broken table. Didn't have the right constraints and resulted in
    tons of duplicates which needed cleaning up (#20). Will remove this eventually
    and rename field_entries2 & its constraints.
    """
    __tablename__ = 'field_entries'
    id = IDCol()
    value = sa.Column(sa.Float)
    created_at = DateCol()
    user_id = FKCol('users.id', index=True)
    field_id = FKCol('fields.id')

    user = orm.relationship("User")
    field = orm.relationship("Field")


at_tz = "at time zone :tz"
tz_read = f"coalesce(:day ::timestamp {at_tz}, now() {at_tz})"
tz_write = f"coalesce(:day ::timestamp {at_tz}, now())"
class FieldEntry(Base):
    __tablename__ = 'field_entries2'
    # day & field_id may be queries independently, so compound primary-key not enough - index too
    field_id = FKCol('fields.id', primary_key=True, index=True)
    day = sa.Column(sa.Date, primary_key=True, index=True)

    created_at = DateCol()
    value = sa.Column(sa.Float)  # Later consider more storage options than float
    user_id = FKCol('users.id', index=True)

    # remove these after duplicates bug handled
    dupes = sa.Column(psql.JSONB)
    dupe = sa.Column(sa.Integer, server_default="0")

    user = orm.relationship("User")
    field = orm.relationship("Field")

    @staticmethod
    def get_day_entries(db, user_id, day=None):
        user_id = str(user_id)
        tz = User.tz(db, user_id)
        res = db.execute(sa.text(f"""
        select fe.* from field_entries2 fe
        where fe.user_id=:user_id
        and date({tz_read})=
            --use created_at rather than day in case they switch timezones
            date(fe.created_at {at_tz})
        """), dict(user_id=user_id, day=day, tz=tz))
        return res.fetchall()

    @staticmethod
    def upsert(db, user_id, field_id, value, day:str=None):
        """
        Create a field-entry, but if one exists for the specified day update it instead.
        """
        # Timezone-handling is very complicated. Defer as much to Postgres (rather than Python) to keep
        # to one system as much as possible. Below says "if they said a day (like '2020-11-19'), convert that
        # to a timestamp at UTC; then convert that to their own timezone". timestamptz cast first is important, see
        # https://stackoverflow.com/a/25123558/362790
        tz = User.tz(db, user_id)
        res = db.execute(sa.text(f"""
        insert into field_entries2 (user_id, field_id, value, day, created_at)
        values (:user_id, :field_id, :value, date({tz_read}), {tz_write})
        on conflict (field_id, day) do update set value=:value, dupes=null, dupe=0
        returning *
        """), dict(
            field_id=field_id,
            value=float(value),
            user_id=user_id,
            day=day,
            tz=tz
        ))
        db.commit()
        return res.fetchone()


class Person(Base):
    user = orm.relationship("User")


class Share(Base):
    user = orm.relationship("User")
    shares_users = orm.relationship("ShareUser")
    shares_groups = orm.relationship("ShareGroup")
    # share_tags = orm.relationship("ShareTag", **parent_cascade)
    # tags_ = orm.relationship("Tag", secondary="shares_tags")

    @staticmethod
    def share_fields(profile=True, share=True):
        res = []
        if profile: res += 'email username first_name last_name gender orientation birthday timezone bio'.split()
        if share: res += 'fields books'.split()
        return res

    @property
    def profile(self):
        return any([getattr(self, k, False) for k in self.share_fields()])

    @staticmethod
    def merge_shares(rows):
        """
        For a user/group with multiple ingress shares, merge those into their maximum permissions.
        TODO do this via SQL instead of Python
        """
        sf = Share.share_fields()
        merged = {}
        for r in rows:
            uid = r['user'].id
            exists = merged.get(uid, None)
            if not exists:
                merged[uid] = r
                continue
            exists = exists['share']
            for k in sf:
                v1 = getattr(exists, k, False)
                v2 = getattr(r['share'], k, False)
                setattr(exists, k, (v1 or v2))
        return [v for v in merged.values()]

    @staticmethod
    def ingress(db: Session, vid):
        rows = (db.query(User, Share)
            .select_from(ShareUser)
            .filter(ShareUser.obj_id == vid)
            .join(Share)
            .join(User)
            .all()
        )
        rows = [dict(user=r[0], share=r[1]) for r in rows]
        return Share.merge_shares(rows)


    @staticmethod
    def egress(db, vid):
        share = (db.query(Share)
                 .filter(Share.user_id == vid).cte())

        tags = (db.query(func.array_agg(ShareTag.tag_id))
                .filter(ShareTag.share_id == share.c.id)
                .as_scalar())

        groups = (db.query(func.array_agg(ShareGroup.obj_id))
                .filter(ShareGroup.share_id == share.c.id)
                .as_scalar())

        users = (db.query(func.array_agg(User.email))
            .join(ShareUser).filter(ShareUser.share_id == share.c.id)
            .as_scalar())

        res = (db.query(
            orm.aliased(Share, share),
            tags,
            users,
            groups,
        ).all())
        return [
            dict(share=r[0], tags=r[1], users=r[2], groups=r[3])
            for r in res
        ]

    @staticmethod
    def put_post_share(db, vid, data):
        # Set the share itself
        share, tags, users, groups = data.get('share', {}), data.get('tags', {}),\
            data.get('users', {}), data.get('groups', {})
        s, sid = None, share.get('id', None)
        if sid:
            s = db.query(Share).filter_by(user_id=vid, id=sid).first()
        if not s:
            s = Share(user_id=vid)
            db.add(s); db.commit(); db.refresh(s)
        sid = s.id
        for k, v in share.items():
            if k not in Share.share_fields(): continue
            setattr(s, k, v)

        # Set share-tags
        db.query(ShareTag)\
            .filter(ShareTag.share_id==sid).delete()
        db.add_all([
            ShareTag(share_id=sid, tag_id=k)
            for k, v in tags.items() if v
        ])
        # .on_conflict_do_nothing(index_elements=['share_id', 'tag_id'])

        # Set users
        db.query(ShareUser) \
            .filter(ShareUser.share_id == sid).delete()
        add_ = [k for k, v in users.items() if v]
        # TODO use insert().from_select()
        add_ = db.query(User.id).filter(User.email.in_(add_)).all()
        db.add_all([
            ShareUser(share_id=sid, obj_id=u)
            for u in add_
        ])

        # Set groups
        db.query(ShareGroup) \
            .filter(ShareGroup.share_id == sid).delete()
        db.add_all([
            ShareGroup(share_id=sid, obj_id=k)
            for k, v in groups.items() if v
        ])

        db.commit()


class Tag(Base):
    # ai = sa.Column(sa.Boolean, server_default="true")

    user = orm.relationship("User")

    @staticmethod
    def snoop(db: Session, vid, sid=None):
        snooping = sid and (vid != sid)
        if snooping:
            q = (db.query(Tag)
                .join(ShareTag, Share)
                .join(ShareUser, sa.and_(
                    ShareTag.share_id == ShareUser.share_id,
                    ShareUser.obj_id == vid,
                    Share.user_id == sid
                ))
                .with_entities(Tag.id, Tag.user_id, Tag.name, Tag.created_at, Tag.main, ShareTag.selected))
        else:
            q = db.query(Tag).filter_by(user_id=vid)
        return q.order_by(Tag.sort.asc())


class EntryTag(Base):
    __tablename__ = 'entries_tags'
    entry_id = FKCol('entries.id', primary_key=True)
    tag_id = FKCol('tags.id', primary_key=True)

    entry = orm.relationship("Entry")
    tag = orm.relationship("Tag")



class ShareGroup(Base):
    __tablename__ = 'shares_groups'
    share_id = FKCol('shares.id', primary_key=True)
    # can't be 'users_groups.group_id' because not unique.
    # just make sure to delete ShareGroup manually when user leaves a group
    obj_id = FKCol('groups.id', primary_key=True)

    share = orm.relationship("Share")
    obj = orm.relationship("Group")


class Book(Base):
    __tablename__ = 'books'
    id = sa.Column(sa.Integer, primary_key=True)
    title = sa.Column(sa.Unicode, nullable=False)
    text = sa.Column(sa.Unicode, nullable=False)
    author = sa.Column(sa.Unicode)
    topic = sa.Column(sa.Unicode)

    thumbs = sa.Column(sa.Integer, server_default=sa.text("0"))
    amazon = sa.Column(sa.Unicode)


class Shelves(enum.Enum):
    ai = "ai"
    cosine = "cosine"
    like = "like"
    already_read = "already_read"
    dislike = "dislike"
    remove = "remove"
    recommend = "recommend"


class Bookshelf(Base):
    __tablename__ = 'bookshelf'
    created_at = DateCol()
    updated_at = DateCol(update=True)

    book_id = sa.Column(sa.Integer, primary_key=True)  # no FK, books change often
    user_id = FKCol('users.id', primary_key=True)
    shelf = sa.Column(sa.Enum(Shelves), nullable=False)
    score = sa.Column(sa.Float)  # only for ai-recs

    # book = orm.relationship("Book")
    user = orm.relationship("User")

    @staticmethod
    def update_books(db, user_id):
        # every x thumbs, update book recommendations
        sql = """
        select count(*)%8=0 as ct from bookshelf 
        where user_id=:uid and shelf not in ('ai', 'cosine')
        """
        should_update = db.execute(sa.text(sql), {'uid':user_id}).fetchone().ct
        if should_update:
            Job.create_job(db, user_id=user_id, method='books', data_in={'args': [str(user_id)]})

    @staticmethod
    def upsert(db, user_id, book_id, shelf):
        db.execute(sa.text("""
        insert into bookshelf(book_id, user_id, shelf)  
        values (:book_id, :user_id, :shelf)
        on conflict (book_id, user_id) do update set shelf=:shelf
        """), dict(user_id=user_id, book_id=int(book_id), shelf=shelf))

        dir = dict(ai=0, cosine=0, like=1, already_read=1, dislike=-1, remove=0, recommend=1)[shelf]
        db.execute(sa.text("""
        update books set thumbs=thumbs+:dir where id=:bid
        """), dict(dir=dir, bid=book_id))

        db.commit()
        Bookshelf.update_books(db, user_id)

    @staticmethod
    def get_shelf(db, user_id, shelf):
        books = db.execute(sa.text(f"""
        select b.id, b.title, b.text, b.author, b.topic, b.amazon
        from books b 
        inner join bookshelf bs on bs.book_id=b.id 
            and bs.user_id=:uid and bs.shelf=:shelf
        order by bs.score asc
        """), dict(uid=user_id, shelf=shelf)).fetchall()
        return books

    @staticmethod
    def books_with_scores(db: Session, uid):
        """
        Get all thumbs for books. This is used by gpu/books.py for predicting recommendations, and the thumbs
        push up-votes closer; down-votes further. Weight this-user's thumbs very high (of course), but also factor
        in other user's thumbs to a small degree - like a rating system.
        """
        shelf_to_score = """
        case when shelf in ('like', 'already_read', 'recommend') then 1
        when shelf in ('dislike') then -1
        else 0 end
        """
        sql = f"""
        -- could use books.thumbs, but it's missing data from before I added it. Maybe switch to it eventually
        with shelf_to_score as (
            select book_id, avg({shelf_to_score}) as score
            from bookshelf where shelf not in ('ai', 'cosine')
            -- where user_id!=%(uid)s -- meh, I'll just double-count the user's score & modify math downstream, makes this sql easier
            group by book_id
        ), books_ as (
            select b.*, 
                s.score as global_score,
                s.score is not null as any_rated
            from books b
            left outer join shelf_to_score s on b.id=s.book_id
        )
        select b.*,
            {shelf_to_score} as user_score, 
            (shelf is not null and shelf not in ('ai', 'cosine')) as user_rated
        from books_ b
        left outer join bookshelf s on b.id=s.book_id and s.user_id=%(uid)s
        -- sort id asc since that's how we mapped to numpy vectors in first place (order_values)
        order by b.id asc
        """
        # return pd.read_sql(sql, db.bind, params={'uid': uid})\
        #     .set_index('id', drop=False)

    @staticmethod
    def top_books(db):
        sql = f"""
        with books_ as (
            select b.id, count(s.shelf) ct from books b
            inner join bookshelf s on b.id=s.book_id
            where s.shelf in ('like', 'already_read') and amazon is not null
            group by b.id
        )
        select b.title, b.author, b.topic, b.amazon from books b
        inner join books_ b_ on b_.id=b.id
        order by b_.ct desc limit 10
        """
        return db.execute(sql).fetchall()


###
# Cache models, storing data for use after machine learning runs
###

class CacheEntry(Base):
    __tablename__ = 'cache_entries'
    entry_id = FKCol('entries.id', primary_key=True)
    paras = Encrypt(array=True)
    clean = Encrypt(array=True)
    vectors = sa.Column(psql.ARRAY(sa.Float, dimensions=2))

    entry = orm.relationship("Entry")

    @staticmethod
    def get_paras(db, entries_q, profile_id=None):
        CE, CU = CacheEntry, CacheUser
        entries = entries_q.join(CE, CE.entry_id == Entry.id) \
            .filter(func.array_length(CE.paras,1)>0) \
            .with_entities(CE.paras).all()
        paras = [p for e in entries for p in e.paras if e.paras]

        if profile_id:
            profile = db.query(CU) \
                .filter(func.array_length(CU.paras,1)>0, CU.user_id == profile_id) \
                .with_entities(CU.paras) \
                .first()
            if profile:
                paras = profile.paras + paras

        return paras


class CacheUser(Base):
    __tablename__ = 'cache_users'
    user_id = FKCol('users.id', primary_key=True)
    paras = Encrypt(array=True)
    clean = Encrypt(array=True)
    vectors = sa.Column(psql.ARRAY(sa.Float, dimensions=2))

    user = orm.relationship("User")


class Influencer(Base):
    __tablename__ = 'influencers'
    field_id = FKCol('fields.id', primary_key=True)
    influencer_id = FKCol('fields.id', primary_key=True)
    score = sa.Column(sa.Float, nullable=False)

    field = orm.relationship("Field", foreign_keys=[field_id])
    influencer = orm.relationship("Field", foreign_keys=[influencer_id])


class ModelHypers(Base):
    __tablename__ = 'model_hypers'
    id = IDCol()
    model = sa.Column(sa.Unicode, nullable=False, index=True)
    model_version = sa.Column(sa.Integer, nullable=False, index=True)
    user_id = FKCol('users.id')
    created_at = DateCol()
    score = sa.Column(sa.Float, nullable=False)
    hypers = sa.Column(psql.JSONB, nullable=False)
    meta = sa.Column(psql.JSONB)  # for xgboost it's {n_rows, n_cols}

    user = orm.relationship("User")


# class MatchTypes(enum.Enum):
#     users = "users"
#     groups = "groups"


# class Match(Base):
#     __tablename__ = 'matches'
#     id = IDCol()
#     owner_id = FKCol('users.id', index=True, nullable=False)
#     user_id = FKCol('users.id', index=True)
#     groups_id = FKCol('groups.id', index=True)
#     match_type = sa.Column(sa.Enum(MatchTypes), nullable=False)
#     score = sa.Column(sa.Float, nullable=False)


class GroupPrivacy(enum.Enum):
    public = "public"
    matchable = "matchable"
    private = "private"


class GroupRoles(enum.Enum):
    member = "member"
    owner = "owner"
    admin = "admin"
    banned = "banned"


class Group(Base):
    __tablename__ = 'groups'
    id = IDCol()
    owner_id = FKCol('users.id', index=True, nullable=False)
    title = Encrypt(sa.Unicode, nullable=False)
    text_short = Encrypt(sa.Unicode, nullable=False)
    text_long = Encrypt(sa.Unicode)
    privacy = sa.Column(sa.Enum(GroupPrivacy), server_default=GroupPrivacy.public.value, nullable=False)
    official = sa.Column(sa.Boolean, server_default="false")
    created_at = DateCol()
    updated_at = DateCol(update=True)

    # On-updates to show on groups-list page, so don't need to run SQL each time
    n_members = sa.Column(sa.Integer, server_default="1", nullable=False)
    n_messages = sa.Column(sa.Integer, server_default="0", nullable=False)
    last_message = sa.Column(sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False)
    owner_name = sa.Column(sa.Unicode)

    # Perks
    perk_member = sa.Column(sa.Float)
    perk_member_donation = sa.Column(sa.Boolean, server_default="false")
    perk_entry = sa.Column(sa.Float)
    perk_entry_donation = sa.Column(sa.Boolean, server_default="false")
    perk_video = sa.Column(sa.Float)
    perk_video_donation = sa.Column(sa.Boolean, server_default="false")

    owner = orm.relationship("User")

    @staticmethod
    def create_group(db, data, vid):
        g = Group(**data.dict(), owner_id=vid)
        ug = UserGroup(group=g, user_id=vid, role=GroupRoles.owner)
        db.add(ug)
        g.owner_name = ug.username
        db.commit()
        db.refresh(g)
        return g

    @staticmethod
    def get_groups(db):
        return db.query(Group) \
            .filter(Group.privacy == GroupPrivacy.public).all()

    @staticmethod
    def my_groups(db, vid):
        rows = (db.query(Group, UserGroup)
            .join(UserGroup.group)
            .filter(
                UserGroup.group_id == Group.id,
                UserGroup.user_id == vid,
                UserGroup.role != GroupRoles.banned
            ).all())
        for r in rows:
            r[0].role = r[1].role
        return [r[0] for r in rows]

    @staticmethod
    def join_group(db, gid, vid, role=GroupRoles.member):
        if db.query(UserGroup).filter(UserGroup.user_id == vid, UserGroup.group_id == gid).first():
            # already joined
            raise GnothiException(400, "ALREADY_JOINED", "You've already joined this group")
        ug = UserGroup(
            user_id=vid,
            group_id=gid,
            role=role
        )
        db.add(ug)
        db.execute(sa.text("""
        update groups g 
        set n_members=(select count(*) from users_groups ug where ug.group_id=:gid and ug.role!='banned')
        where g.id=:gid
        """), dict(gid=gid))
        db.commit()
        return ug

    @staticmethod
    def leave_group(db, gid, uid):
        ug = db.query(UserGroup) \
            .filter_by(user_id=uid, group_id=gid)
        ug_ = ug.first()
        if ug_:
            #  since won't be available after delete
            ug_ = ug_.__dict__
        ug.delete()
        db.commit()
        return ug_


class UserGroup(Base):
    __tablename__ = 'users_groups'
    user_id = FKCol('users.id', primary_key=True)
    group_id = FKCol('groups.id', primary_key=True)

    # Temporary/private name & id assigned for this user for this group.
    # If they opt to expose real username, it will be used instead
    username = Encrypt(default=petname.Generate, nullable=False)  # auto-generate a random name (adjective-animal)

    joined_at = DateCol()
    role = sa.Column(sa.Enum(GroupRoles), nullable=False, server_default=GroupRoles.member.value)

    user = orm.relationship("User")
    group = orm.relationship("Group")

    @staticmethod
    def get_members(db, gid):
        share = (db.query(Share).join(ShareGroup, sa.and_(
            ShareGroup.obj_id == gid,
            ShareGroup.share_id == Share.id
        )).subquery())
        share = orm.aliased(Share, share)
        rows = (
            db.query(
                User,
                UserGroup,
                share
            )
            .select_from(UserGroup).filter(UserGroup.group_id == gid)
            .join(User)
            .outerjoin(share)
            .all())
        rows = [dict(user=r[0], user_group=r[1], share=r[2]) for r in rows]
        return Share.merge_shares(rows)

    @staticmethod
    def get_uids(db, gid):
        UG = UserGroup
        res = db.query(UG.user_id) \
            .filter(UG.group_id == gid, UG.role != GroupRoles.banned)\
            .all()
        return [str(r.user_id) for r in res]

    @staticmethod
    def check_access(db: Session, gid, vid, roles=None):
        q = db.query(UserGroup.role)\
            .filter(
                UserGroup.user_id == vid,
                UserGroup.group_id == gid,
                UserGroup.role != GroupRoles.banned
            )
        if roles:
            q = q.filter(UserGroup.role.in_(roles))
        if not q.scalar(): raise GroupDenied()

    @staticmethod
    def invite_member(db: Session, gid, vid, email):
        UserGroup.check_access(db, gid, vid, roles=[GroupRoles.owner, GroupRoles.admin])
        uid = db.query(User.id).filter_by(email=email).scalar()
        if not uid:
            return dict(valid=False)
        if db.query(UserGroup).filter_by(user_id=uid, group_id=gid).first():
            # Already member
            return dict(valid=True)
        db.add(UserGroup(user_id=uid, group_id=gid))
        db.commit()
        return dict(valid=True)


# class UserMessage(Base):
#     __tablename__ = 'users_messages'
#     id = IDCol()
#     user_id = FKCol('users.id', index=True)
#     obj_id = FKCol('users.id', index=True)
#     created_at = DateCol()
#     updated_at = DateCol(update=True)
#     text = Encrypt(sa.Unicode, nullable=False)


class GroupMessage(Base):
    __tablename__ = 'groups_messages'
    id = IDCol()
    user_id = FKCol('users.id', index=True)
    obj_id = FKCol('groups.id', index=True)
    created_at = DateCol()
    updated_at = DateCol(update=True)
    text = Encrypt(sa.Unicode, nullable=False)

    user = orm.relationship("User")
    obj = orm.relationship("Group")

    @staticmethod
    def get_messages(db, gid, vid):
        UserGroup.check_access(db, gid, vid)
        return db.query(GroupMessage) \
            .filter(GroupMessage.obj_id == gid) \
            .order_by(GroupMessage.created_at.asc()) \
            .all()

    @staticmethod
    def create_message(db, gid, msg, vid=None):
        if vid:
            UserGroup.check_access(db, gid, vid)
        else:
            vid = ADMIN_ID
        msg = GroupMessage(user_id=vid, text=msg, obj_id=gid)
        db.add(msg)
        db.execute(sa.text("""
        update groups set
            last_message=now(), 
            n_messages=(select count(*) from groups_messages gm where gm.obj_id=:gid)
        where id=:gid
        """), dict(gid=gid))
        db.commit()
        db.refresh(msg)
        return msg


class GroupNotif(Base):
    __tablename__ = 'groups_notifs'
    user_id = FKCol('users.id', primary_key=True)
    obj_id = FKCol('groups.id', primary_key=True)
    count = sa.Column(sa.Integer, server_default="0")
    last_seen = DateCol()

    user = orm.relationship("User")
    obj = orm.relationship("Group")

    @staticmethod
    def create_notifs(db, gid):
        res = db.execute(sa.text("""
        with users_ as (
            select user_id as id from users_groups ug
            where ug.group_id=:gid and ug.role != 'banned'
        )
        insert into groups_notifs (user_id, obj_id, count)
        select u.id, :gid, 1 from users_ u
        on conflict (user_id, obj_id) do update
        set count=groups_notifs.count+1
        returning obj_id, user_id, count
        """), dict(gid=gid))
        db.commit()
        return res.fetchall()


class NoteNotif(Base):
    __tablename__ = 'notes_notifs'
    user_id = FKCol('users.id', primary_key=True)
    obj_id = FKCol('entries.id', primary_key=True)
    count = sa.Column(sa.Integer, server_default="0")
    last_seen = DateCol()

    user = orm.relationship("User")
    obj = orm.relationship("Entry")

    @staticmethod
    def create_notifs(db, eid):
        res = db.execute(sa.text("""
        with users_ as (
            -- owner 
            select e.user_id as id 
            from entries e where e.id=:eid
            -- and anyone shared
            union
            select u.id from users u
            inner join shares_users su on su.obj_id=u.id
            inner join shares s on s.id=su.share_id
            inner join shares_tags st on st.share_id=s.id
            inner join entries_tags et on st.tag_id=et.tag_id
            inner join entries e on e.id=et.entry_id and e.id=:eid
            
        )
        insert into notes_notifs (user_id, obj_id, count)
        select u.id, :eid, 1 from users_ u
        on conflict (user_id, obj_id) do update
        set count=notes_notifs.count+1
        returning obj_id, user_id, count
        """), dict(eid=eid))
        db.commit()
        return res.fetchall()


class ShareNotif(Base):
    __tablename__ = 'shares_notifs'
    user_id = FKCol('users.id', primary_key=True)
    obj_id = FKCol('shares.id', primary_key=True)
    count = sa.Column(sa.Integer, server_default="0")
    last_seen = DateCol()

    user = orm.relationship("User")
    obj = orm.relationship("Share")


# class MessageReaction(Base):
#     __tablename__ = 'message_reactions'
#     user_id = FKCol('users.id', primary_key=True)
#     message_id = FKCol('messages.id', primary_key=True)
#     reaction = sa.Column(sa.Unicode)  # deal with emoji enums later
#     created_at = DateCol()


class Misc(Base):
    __tablename__ = 'misc'
    key = sa.Column(sa.Unicode, primary_key=True)
    val = sa.Column(sa.Unicode)


class Payment(Base):
    __tablename__ = 'payments'

    id = IDCol()
    user_id = FKCol('users.id', index=True)
    created_at = DateCol()
    event_type = sa.Column(sa.Unicode, nullable=False)
    data = sa.Column(psql.JSONB, nullable=False)

    user = orm.relationship('User')


class CodeTypes(enum.Enum):
    coupon = "coupon"
    affiliate = "affiliate"


def gen_code():
    return shortuuid.ShortUUID().random(length=8)


class Codes(Base):
    """
    Users can generate a link to Gnothi via an affiliate code. Gets applied to clicking user's account,
    any money they spend / make the affiliate gets a cut. Also allows for future coupon-code use
    """
    __tablename__ = "codes"

    owner_id = FKCol('users.id', index=True)
    code = sa.Column(sa.Unicode, primary_key=True, default=gen_code)
    amount = sa.Column(sa.Float, server_default="0")  # eg, .3 for 30% cut for affiliate
