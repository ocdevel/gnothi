import enum, pdb, re, threading, time, datetime, traceback, orjson, json
from typing import Optional, List, Any, Dict, Union
from pydantic import UUID4
import pandas as pd
import logging
logger = logging.getLogger(__name__)

from common.database import Base, with_db
from common.utils import vars

import sqlalchemy as sa
import sqlalchemy.orm as orm
from psycopg2.extras import Json as to_jsonb
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy_utils.types import EmailType
from sqlalchemy_utils.types.encrypted.encrypted_type import StringEncryptedType, FernetEngine
from sqlalchemy.orm import Session
import petname



# https://dev.to/zchtodd/sqlalchemy-cascading-deletes-8hk
parent_cascade = dict(cascade="all, delete", passive_deletes=True)
child_cascade = dict(ondelete="cascade")


# Note: using sa.sa.Unicode for all Text/Varchar columns to be consistent with sqlalchemy_utils examples. Also keeping all
# text fields unlimited (no varchar(max_length)) as Postgres doesn't incur penalty, unlike MySQL, and we don't know
# how long str will be after encryption.
def Encrypt(Col=sa.Unicode, array=False, **args):
    enc = StringEncryptedType(Col, vars.FLASK_KEY, FernetEngine)
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


class User(Base):
    __tablename__ = 'users'

    id = IDCol()
    email = sa.Column(sa.String(length=320), unique=True, index=True, nullable=False)
    cognito_id = sa.Column(sa.Unicode, index=True)
    # ws_id = sa.Column(sa.Unicode, index=True)

    created_at = DateCol()
    updated_at = DateCol(update=True)

    username = sa.Column(sa.Unicode, index=True)
    # socket_id = sa.Column(sa.Unicode, index=True)
    # as = FKCol('users.id')

    first_name = Encrypt()
    last_name = Encrypt()
    gender = Encrypt()
    orientation = Encrypt()
    birthday = sa.Column(sa.Date)  # TODO encrypt (how to store/migrate dates?)
    timezone = sa.Column(sa.Unicode)
    bio = Encrypt()
    is_cool = sa.Column(sa.Boolean, server_default='false')
    therapist = sa.Column(sa.Boolean, server_default='false')
    paid = sa.Column(sa.Boolean)

    ai_ran = sa.Column(sa.Boolean, server_default='false')
    last_books = DateCol(default=False)
    last_influencers = DateCol(default=False)

    habitica_user_id = Encrypt()
    habitica_api_token = Encrypt()

    entries = orm.relationship("Entry", order_by='Entry.created_at.desc()', **parent_cascade)
    field_entries = orm.relationship("FieldEntry", order_by='FieldEntry.created_at.desc()', **parent_cascade)
    fields = orm.relationship("Field", order_by='Field.created_at.asc()', **parent_cascade)
    people = orm.relationship("Person", order_by='Person.name.asc()', **parent_cascade)
    shares = orm.relationship("Share", **parent_cascade)
    tags = orm.relationship("Tag", order_by='Tag.name.asc()', **parent_cascade)

    @staticmethod
    def snoop(db, viewer, as_id=None):
        as_user, snooping = None, False
        if as_id and viewer.id != as_id:
            snooping = True
            as_user = db.query(User) \
                .join(Share) \
                .filter(Share.email == viewer.email, Share.user_id == as_id) \
                .first()
        if as_user:
            as_user.share_data = db.query(Share) \
                .filter_by(user_id=as_id, email=viewer.email) \
                .first()
        else:
            as_user = viewer
        return as_user, snooping

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
    __tablename__ = 'entries'

    id = IDCol()
    created_at = DateCol()
    updated_at = DateCol(update=True)

    # Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
    title = Encrypt()
    text = Encrypt(sa.Unicode, nullable=False)
    no_ai = sa.Column(sa.Boolean, server_default='false')
    ai_ran = sa.Column(sa.Boolean, server_default='false')

    # Generated
    title_summary = Encrypt()
    text_summary = Encrypt()
    sentiment = Encrypt()

    user_id = FKCol('users.id', index=True)
    entry_tags_ = orm.relationship("EntryTag", **parent_cascade)

    # share_tags = orm.relationship("EntryTag", secondary="shares_tags")

    @property
    def entry_tags(self):
        return {str(t.tag_id): True for t in self.entry_tags_}

    @staticmethod
    def snoop(
        db: Session,
        viewer_email: str,
        target_id: str,
        snooping: bool = False,
        entry_id: str = None,
        order_by=None,
        tags: List[str] = None,
        days: int = None,
        for_ai: bool = False
    ):
        if not snooping:
            q = db.query(Entry).filter(Entry.user_id == target_id)
        if snooping:
            q = db.query(Entry)\
                .join(EntryTag, Entry.id == EntryTag.entry_id)\
                .join(ShareTag, EntryTag.tag_id == ShareTag.tag_id)\
                .join(Share, ShareTag.share_id == Share.id)\
                .filter(Share.email == viewer_email, Share.user_id == target_id)
            # TODO use ORM partial thus far for this query command, not raw sql
            sql = f"""
            update shares set last_seen=now(), new_entries=0
            where email=:email and user_id=:uid
            """
            db.execute(sa.text(sql), dict(email=viewer_email, uid=target_id))
            db.commit()

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

    def run_models(self, db):
        self.ai_ran = False
        if self.no_ai:
            self.title_summary = self.text_summary = self.sentiment = None
            return

        # Run summarization/sentiment in background thread, so (a) user can get back to business;
        # (b) if AI server offline, wait till online
        self.title_summary = "🕒 AI is generating a title"
        self.text_summary = "🕒 AI is generating a summary"
        # not used in nlp, but some other meta stuff
        data_in = dict(args=[str(self.id)])
        Job.create_job(db, user_id=self.user_id, method='entries', data_in=data_in)

    def update_snoopers(self, db):
        """Updates snoopers with n_new_entries since last_seen"""
        sql = """
        with news as (
          select s.id, count(e.id) ct 
          from shares s 
          inner join shares_tags st on st.share_id=s.id
          inner join entries_tags et on et.tag_id=st.tag_id
          inner join entries e on e.id=et.entry_id
          where e.user_id=:uid 
            and e.created_at > s.last_seen
          group by s.id
        )
        update shares s set new_entries=n.ct from news n where n.id=s.id
        """
        db.execute(sa.text(sql), {'uid': self.user_id})
        db.commit()


class NoteTypes(enum.Enum):
    label = "label"
    note = "note"
    resource = "resource"


class Note(Base):
    __tablename__ = 'notes'
    id = IDCol()
    created_at = DateCol()
    entry_id = FKCol('entries.id', index=True)
    user_id = FKCol('users.id', index=True)
    type = sa.Column(sa.Enum(NoteTypes), nullable=False)
    text = Encrypt(sa.Unicode, nullable=False)
    private = sa.Column(sa.Boolean, server_default='false')

    @staticmethod
    def snoop(
        db: Session,
        viewer_id: UUID4,
        target_id: UUID4,
        entry_id: UUID4,
    ):
        # TODO use .join(ShareTag) for non-private permissions?
        return db.query(Note)\
            .join(Entry)\
            .filter(
                Note.entry_id == entry_id,
                sa.or_(
                    # My own private note
                    sa.and_(Note.private.is_(True), Note.user_id == viewer_id),
                    # Or this user can view it
                    sa.and_(Note.private.is_(False), Entry.user_id.in_((viewer_id, target_id)))
                ))\
            .order_by(Note.created_at.asc())


class FieldType(enum.Enum):
    # medication changes / substance intake
    # exercise, sleep, diet, weight
    number = "number"

    # happiness score
    fivestar = "fivestar"

    # periods
    check = "check"

    # moods (happy, sad, anxious, wired, bored, ..)
    option = "option"

    # think of more
    # weather_api?
    # text entries?


class DefaultValueTypes(enum.Enum):
    value = "value"  # which includes None
    average = "average"
    ffill = "ffill"


class Field(Base):
    """Entries that change over time. Uses:
    * Charts
    * Effects of sentiment, topics on entries
    * Global trends (exercise -> 73% happiness)
    """
    __tablename__ = 'fields'

    id = IDCol()

    type = sa.Column(sa.Enum(FieldType))
    name = Encrypt()
    # Start entries/graphs/correlations here
    created_at = DateCol()
    # Don't actually delete fields, unless it's the same day. Instead
    # stop entries/graphs/correlations here
    excluded_at = DateCol(default=False)
    default_value = sa.Column(sa.Enum(DefaultValueTypes), server_default="value")
    default_value_value = sa.Column(sa.Float)
    # option{single_or_multi, options:[], ..}
    # number{float_or_int, ..}
    attributes = sa.Column(sa.JSON)
    # Used if pulling from external service
    service = sa.Column(sa.Unicode)
    service_id = sa.Column(sa.Unicode)

    user_id = FKCol('users.id', index=True)

    # Populated via ml.influencers.
    influencer_score = sa.Column(sa.Float, server_default='0')
    next_pred = sa.Column(sa.Float, server_default='0')
    avg = sa.Column(sa.Float, server_default="0")

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
    __tablename__ = 'people'
    id = IDCol()
    name = Encrypt()
    relation = Encrypt()
    issues = Encrypt()
    bio = Encrypt()

    user_id = FKCol('users.id', index=True)


class Share(Base):
    __tablename__ = 'shares'
    id = IDCol()
    user_id = FKCol('users.id', index=True)
    email = sa.Column(EmailType, index=True)  # TODO encrypt?

    fields = sa.Column(sa.Boolean)
    books = sa.Column(sa.Boolean)
    profile = sa.Column(sa.Boolean)

    share_tags = orm.relationship("ShareTag", **parent_cascade)
    tags_ = orm.relationship("Tag", secondary="shares_tags")

    last_seen = DateCol()
    new_entries = sa.Column(sa.Integer, server_default=sa.text("0"))

    @property
    def tags(self):
        return {str(t.tag_id): True for t in self.share_tags}

    @staticmethod
    def shared_with_me(db: Session, email):
        return db.execute("""
        select s.*, u.* from users u
        inner join shares s on s.email=:email and u.id=s.user_id
        """, {'email': email}).fetchall()


class Tag(Base):
    __tablename__ = 'tags'
    id = IDCol()
    user_id = FKCol('users.id', index=True)
    name = Encrypt(sa.Unicode, nullable=False)
    created_at = DateCol()
    # Save user's selected tags between sessions
    selected = sa.Column(sa.Boolean, server_default="true")
    main = sa.Column(sa.Boolean, server_default="false")

    shares = orm.relationship("Share", secondary="shares_tags")

    @staticmethod
    def snoop(db: Session, from_email, to_id, snooping=False):
        if snooping:
            q = db.query(Tag)\
                .with_entities(Tag.id, Tag.user_id, Tag.name, Tag.created_at, Tag.main, ShareTag.selected)\
                .join(ShareTag, Share)\
                .filter(Share.email == from_email, Share.user_id == to_id)
        else:
            q = db.query(Tag).filter_by(user_id=to_id)
        return q.order_by(Tag.main.desc(), Tag.created_at.asc(), Tag.name.asc())


class EntryTag(Base):
    __tablename__ = 'entries_tags'
    entry_id = FKCol('entries.id', primary_key=True)
    tag_id = FKCol('tags.id', primary_key=True)


class ShareTag(Base):
    __tablename__ = 'shares_tags'
    share_id = FKCol('shares.id', primary_key=True)
    tag_id = FKCol('tags.id', primary_key=True)
    selected = sa.Column(sa.Boolean, server_default="true")

    tag = orm.relationship(Tag, backref=orm.backref("tags"))
    share = orm.relationship(Share, backref=orm.backref("shares"))


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
        return pd.read_sql(sql, db.bind, params={'uid': uid})\
            .set_index('id', drop=False)

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


class MachineTypes(enum.Enum):
    gpu = "gpu"
    server = "server"


class Job(Base):
    __tablename__ = 'jobs'
    id = IDCol()
    user_id = FKCol('users.id')
    created_at = DateCol()
    updated_at = DateCol(update=True)
    method = sa.Column(sa.Unicode, index=True, nullable=False)
    state = sa.Column(sa.Unicode, server_default="new", index=True)
    run_on = sa.Column(sa.Enum(MachineTypes), server_default="gpu", index=True)
    # FK of Machine.id (but don't use FK, since we delete Machines w/o invalidating jobs)
    machine_id = sa.Column(sa.Unicode, index=True)
    data_in = sa.Column(psql.JSONB)
    data_out = sa.Column(psql.JSONB)

    @staticmethod
    def create_job(db, user_id, method, data_in={}, **kwargs):
        """
        Ensures certain jobs only created once at a time. Never manually add Job() call this instead
        """
        arg0 = data_in.get('args', [None])[0]
        if type(arg0) != str: arg0 = None

        # For entries, profiles: set ai_ran=False to queue them into the next batch
        if method in ('entries', 'profiles') and arg0:
            table = dict(entries='entries', profiles='users')[method]
            db.execute(sa.text(f"""
            update {table} set ai_ran=False where id=:id;
            """), dict(id=arg0))
            db.commit()

        exists = db.execute(sa.text("""
        select 1 from jobs
        -- maybe if we're mid-job, things have changed; so don't incl. working? rethink 
        --where method=:method and state in ('new', 'working') and
        where method=:method and state='new' and
        case
            when method='influencers' then true
            when method='books' and data_in->'args'->>0=:arg0 then true
            when method='entries' and data_in->'args'->>0=:arg0 then true
            when method='profiles' and data_in->'args'->>0=:arg0 then true
            when method='habitica' then true
            else false
        end
        """), dict(method=method, arg0=arg0)).fetchone()
        if exists: return False

        j = Job(user_id=user_id, method=method, data_in=data_in, **kwargs)
        db.add(j)
        db.commit()
        db.refresh(j)
        return str(j.id)

    @staticmethod
    def place_in_queue(db, jid):
        return db.execute(sa.text(f"""
        select (
            (select count(*) from jobs where state in ('working', 'new') and created_at < (select created_at from jobs where id=:jid))
            / greatest((select count(*) from machines where status in ('on', 'pending')), 1)
        ) as ct
        """), dict(jid=jid)).fetchone().ct

    @staticmethod
    def wrap_job(jid, method, fn):
        logger.info(f"Run job {method}")
        try:
            start = time.time()
            res = fn()
            sql = "update jobs set state='done', data_out=:data where id=:jid"
            logger.info(f"Job {method} complete {time.time() - start}")
        except Exception as err:
            err = str(traceback.format_exc())  # str(err)
            res = dict(error=err)
            sql = "update jobs set state='error', data_out=:data where id=:jid"
            logger.error(f"Job {method} error {time.time() - start} {err}")
        with with_db() as db:
            db.execute(sa.text(sql), dict(data=to_jsonb(res), jid=str(jid)))
            db.execute(sa.text("select pg_notify('jobs', :jid)"), dict(jid=str(jid)))
            db.commit()

    @staticmethod
    def take_job(db, sql_frag):
        job = db.execute(sa.text(f"""
        update jobs set state='working', machine_id=:machine 
        where id = (
            select id from jobs 
            where state='new' and {sql_frag}
            order by created_at asc
            for update skip locked
            limit 1
        )
        returning id, method
        """), dict(machine=vars.MACHINE)).fetchone()
        db.commit()
        return job

    @staticmethod
    def prune(db):
        """prune completed or stuck jobs. Completed jobs aren't too useful for admins; error is."""
        db.execute(f"""
        delete from jobs 
        where updated_at < now() - interval '10 minutes' 
            and state in ('working', 'done') 
        """)
        db.commit()

    # ea063dfa: last_job()


class Machine(Base):
    """
    List of running machines (gpu, server)
    """
    __tablename__ = 'machines'
    id = sa.Column(sa.Unicode, primary_key=True)  # socket.hostname()
    #type = sa.Column(sa.Enum(MachineTypes), server_default="gpu")
    status = sa.Column(sa.Unicode)
    created_at = DateCol()
    updated_at = DateCol(update=True)

    @staticmethod
    def gpu_status(db):
        res = db.execute(f"""
        select status from machines
        where updated_at > now() - interval '5 minutes'
        -- prefer 'on' over others, to show online if so
        order by case 
            when status='on' then 1
            when status='pending' then 2
            else 3
        end asc
        limit 1
        """).fetchone()
        return res.status if res else "off"

    @staticmethod
    def notify_online(db, id, status='on'):
        # missing vals get server_default
        db.execute(sa.text(f"""
        insert into machines (id, status) values (:id, :status)
        on conflict(id) do update set status=:status, updated_at=now()
        """), dict(id=id, status=status))
        db.commit()

    @staticmethod
    def prune(db):
        """prune machines which haven't removed themselves properly"""
        db.execute(f"""
        delete from machines where updated_at < now() - interval '5 minutes' 
        """)
        db.commit()

    @staticmethod
    def job_ct_on_machine(db, id):
        return db.execute(sa.text(f"""
        select count(*) ct from jobs where state='working'
            and machine_id=:id
            -- check time in case broken/stale
            and created_at > now() - interval '2 minutes'
        """), dict(id=id)).fetchone().ct


###
# Cache models, storing data for use after machine learning runs
###

class CacheEntry(Base):
    __tablename__ = 'cache_entries'
    entry_id = FKCol('entries.id', primary_key=True)
    paras = Encrypt(array=True)
    clean = Encrypt(array=True)
    vectors = sa.Column(psql.ARRAY(sa.Float, dimensions=2))

    @staticmethod
    def get_paras(db, entries_q, profile_id=None):
        CE, CU = CacheEntry, CacheUser
        entries = entries_q.join(CE, CE.entry_id == Entry.id) \
            .filter(sa.func.array_length(CE.paras,1)>0) \
            .with_entities(CE.paras).all()
        paras = [p for e in entries for p in e.paras if e.paras]

        if profile_id:
            profile = db.query(CU) \
                .filter(sa.func.array_length(CU.paras,1)>0, CU.user_id == profile_id) \
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


class Influencer(Base):
    __tablename__ = 'influencers'
    field_id = FKCol('fields.id', primary_key=True)
    influencer_id = FKCol('fields.id', primary_key=True)
    score = sa.Column(sa.Float, nullable=False)


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


class MatchTypes(enum.Enum):
    users = "users"
    groups = "groups"


class Match(Base):
    __tablename__ = 'matches'
    id = IDCol()
    owner_id = FKCol('users.id', index=True, nullable=False)
    user_id = FKCol('users.id', index=True)
    groups_id = FKCol('groups.id', index=True)
    match_type = sa.Column(sa.Enum(MatchTypes), nullable=False)
    score = sa.Column(sa.Float, nullable=False)


class GroupPrivacy(enum.Enum):
    public = "public"
    private = "private"  # invite-only
    paid = "paid"


class GroupRoles(enum.Enum):
    member = "member"
    owner = "owner"
    admin = "admin"
    banned = "banned"


class Group(Base):
    __tablename__ = 'groups'
    id = IDCol()
    owner = FKCol('users.id', index=True)
    title = Encrypt(sa.Unicode, nullable=False)
    text = Encrypt(sa.Unicode, nullable=False)
    privacy = sa.Column(sa.Enum(GroupPrivacy))
    created_at = DateCol()
    updated_at = DateCol(update=True)

    @staticmethod
    def create_group(db, title, text, owner, privacy=GroupPrivacy.public):
        g = Group(
            title=title,
            text=text,
            privacy=privacy,
            owner=owner,
        )
        db.add(g)
        db.commit()
        db.refresh(g)
        db.add(UserGroup(
            group_id=g.id,
            user_id=owner,
            role=GroupRoles.owner
        ))
        db.commit()
        return g

    def to_json(self):
        return dict(
            id=str(self.id),
            owner=str(self.owner),
            title=self.title,
            text=self.text,
            privacy=self.privacy.value,
            created_at=str(self.created_at),
            updated_at=str(self.updated_at)  # .__str__() ?
        )

    @staticmethod
    def join_group(db, gid, uid, role=GroupRoles.member):
        if db.query(UserGroup).filter_by(user_id=uid, group_id=gid).first():
            return None
        ug = UserGroup(
            user_id=uid,
            group_id=gid,
            role=role
        )
        db.add(ug)
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
    username = Encrypt(default=petname.Generate)  # auto-generate a random name (adjective-animal)
    user_group_id = IDCol()

    show_username = sa.Column(sa.Boolean)
    show_avatar = sa.Column(sa.Boolean)
    show_first_name = sa.Column(sa.Boolean)
    show_last_name = sa.Column(sa.Boolean)
    show_bio = sa.Column(sa.Boolean)

    joined_at = DateCol()
    role = sa.Column(sa.Enum(GroupRoles))

    @staticmethod
    def get_members(db, gid):
        user_fields = "username first_name last_name bio".split() # username avatar
        rows = db.query(UserGroup, User)\
            .join(User, User.id == UserGroup.user_id)\
            .filter(UserGroup.group_id == gid)\
            .options(
                sa.orm.Load(User).load_only(*user_fields)
            ).all()
        res = {}
        for (ug, u) in rows:
            obj = dict(
                username=ug.username,
                show_first_name=ug.show_first_name,
                show_last_name=ug.show_last_name,
                show_username=ug.show_username,
                show_bio=ug.show_bio,
                joined_at=ug.joined_at.timestamp(),
                role=ug.role.value
            )
            for f in user_fields:
                if obj[f"show_{f}"]:
                    obj[f] = getattr(u, f, None)
            # Display name based on per-member privacies
            uname = []
            if ug.show_first_name and u.first_name: uname.append(u.first_name)
            if ug.show_last_name and u.last_name: uname.append(u.last_name)
            if ug.show_username and u.username and not uname: uname.append(u.username)
            obj['username'] = ' '.join(uname) if uname else ug.username

            res[str(ug.user_id)] = obj
        return res
        # return {
        #     str(ug.user_id): dict(username=ug.username, role=ug.role.value)
        #     for ug in res
        # }

    @staticmethod
    def get_uids(db, gid):
        UG = UserGroup
        res = db.query(UG.user_id) \
            .filter(UG.group_id == gid, UG.role != GroupRoles.banned)\
            .all()
        return [r.user_id for r in res]

    @staticmethod
    def get_role(db: Session, uid, gid):
        UG = UserGroup
        role = db.query(UG.role)\
            .filter(UG.user_id==uid, UG.group_id==gid, UG.role!=GroupRoles.banned)\
            .scalar()
        return role.value if role else None


class Message(Base):
    __tablename__ = 'messages'
    id = IDCol()
    owner_id = FKCol('users.id', index=True)
    user_id = FKCol('users.id', index=True)
    group_id = FKCol('groups.id', index=True)
    recipient_type = sa.Column(sa.Enum(MatchTypes))
    created_at = DateCol()
    updated_at = DateCol(update=True)
    text = Encrypt(sa.Unicode, nullable=False)


class NotifTypes(enum.Enum):
    entries = "entries"
    notes = "notes"
    messages = "messages"


class Notif(Base):
    __tablename__ = 'notifs'
    user_id = FKCol('users.id', primary_key=True)
    type = sa.Column(sa.Enum(NotifTypes), index=True)
    count = sa.Column(sa.Integer, server_default="0")

    entry_id = FKCol('entries.id', index=True)
    note_id = FKCol('notes.id', index=True)
    # For group.messages (reconsider)
    group_id = FKCol('groups.id', index=True)

    created_at = DateCol()
    last_seen = DateCol()

    @staticmethod
    def send_notifs(db, id, type):
        return

        obj = {'type': type}
        k = {
            NotifTypes.entries: 'entry_id',
            NotifTypes.notes: 'note_id',
            NotifTypes.messages: 'group_id'
        }[type]
        obj[k] = id
        # TODO get users who have access
        for user in users_with_access():
            curr = db.query(Notif).filter_by(type=type)
            db.add(Notif(type=type, ))


class MessageReaction(Base):
    __tablename__ = 'message_reactions'
    user_id = FKCol('users.id', primary_key=True)
    message_id = FKCol('messages.id', primary_key=True)
    reaction = sa.Column(sa.Unicode)  # deal with emoji enums later
    created_at = DateCol()


def await_row(db, sql, args={}, wait=.5, timeout=None):
    i = 0
    while True:
        res = db.execute(sa.text(sql), args).fetchone()
        if res: return res
        time.sleep(wait)
        if timeout and wait * i >= timeout:
            return None
        i += 1
