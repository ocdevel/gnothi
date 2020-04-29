import enum, pdb, re
from datetime import date, datetime
from dateutil import tz
from jwtauthtest.database import Base
from jwtauthtest import ml
from sqlalchemy import \
    Column, \
    Integer, \
    String, \
    Text, \
    Enum, \
    Float, \
    ForeignKey, \
    Boolean, \
    DateTime, \
    JSON, \
    Date, \
    ARRAY, \
    func
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils.types import EmailType
from uuid import uuid4


def uuid_():
    return str(uuid4())


class CustomBase():
    def json(self):
        return {k: getattr(self, k) for k in self.json_fields.split()}


class User(Base, CustomBase):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True, default=uuid_)
    # https://stackoverflow.com/a/574698/362790
    username = Column(EmailType, nullable=False, unique=True)
    password = Column(String(200), nullable=False)

    first_name = Column(String(128))
    last_name = Column(String(128))
    gender = Column(String(64))
    orientation = Column(String(64))
    birthday = Column(Date)
    timezone = Column(String(128))
    bio = Column(Text)

    habitica_user_id = Column(String(200))
    habitica_api_token = Column(String(200))

    entries = relationship("Entry", order_by='Entry.created_at.desc()')
    field_entries = relationship("FieldEntry", order_by='FieldEntry.created_at.desc()')
    fields = relationship("Field", order_by='Field.created_at.asc()')
    people = relationship("Person", order_by='Person.name.asc()')
    shares = relationship("Share")
    tags = relationship("Tag", order_by='Tag.name.asc()')

    profile_fields = """
    first_name
    last_name
    gender
    orientation
    birthday
    timezone
    bio
    """

    json_fields = """
    id
    username
    habitica_user_id
    habitica_api_token
    """ + profile_fields

    def __init__(self, username, password):
        self.username = username
        self.password = password

    def __repr__(self):
        return f'<User {{ username: {self.username}, password: {self.password} }}'

    def shared_with_me(self, id=None):
        if id:
            return User.query \
                .join(Share) \
                .filter(Share.email == self.username, Share.user_id==id) \
                .first()
        return User.query\
            .join(Share)\
            .filter(Share.email==self.username)\
            .all()

    def json(self):
        return {
            **super().json(),
            'shared_with_me': [s.json() for s in self.shared_with_me()],
        }

    def profile_json(self):
        return {k: getattr(self, k) for k in self.profile_fields.split()}

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

class Entry(Base, CustomBase):
    __tablename__ = 'entries'

    id = Column(UUID, primary_key=True, default=uuid_)
    # Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
    title = Column(String(128))
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Generated
    title_summary = Column(String(128))
    text_summary = Column(Text)
    sentiment = Column((String(32)))

    user_id = Column(UUID, ForeignKey('users.id'))
    entry_tags = relationship("EntryTag")

    # share_tags = relationship("EntryTag", secondary="shares_tags")

    json_fields = """
    id
    title
    text
    created_at
    title_summary
    text_summary
    sentiment
    """

    @staticmethod
    def snoop(from_email, to_id, type):
        return Entry.query \
            .join(EntryTag, Entry.id == EntryTag.entry_id)\
            .join(ShareTag, EntryTag.tag_id == ShareTag.tag_id)\
            .join(Share, ShareTag.share_id == Share.id)\
            .filter(ShareTag.type.in_(type), Share.email == from_email, Share.user_id == to_id)

    def run_models(self):
        self.title_summary = ml.summarize(self.text, 5, 20)
        self.text_summary = ml.summarize(self.text, 32, 128)
        self.sentiment = ml.sentiment(self.text)


    # TODO look into https://stackoverflow.com/questions/7102754/jsonify-a-sqlalchemy-result-set-in-flask
    #                https://stackoverflow.com/questions/5022066/how-to-serialize-sqlalchemy-result-to-json
    # Marshmallow    https://marshmallow-sqlalchemy.readthedocs.io/en/latest/
    def json(self):
        return {
            **super().json(),
            'entry_tags': {t.tag_id: True for t in self.entry_tags},
        }


class FieldType(enum.Enum):
    # medication changes / substance intake
    # exercise, sleep, diet, weight
    number = 1

    # happiness score
    fivestar = 2

    # periods
    check = 3

    # moods (happy, sad, anxious, wired, bored, ..)
    option = 4

    # think of more
    # weather_api?
    # text entries?


class DefaultValueTypes(enum.Enum):
    value = 1  # which includes None
    average = 2
    ffill = 3


class Field(Base, CustomBase):
    """Entries that change over time. Uses:
    * Charts
    * Effects of sentiment, topics on entries
    * Global trends (exercise -> 73% happiness)
    """
    __tablename__ = 'fields'

    id = Column(UUID, primary_key=True, default=uuid_)
    type = Column(Enum(FieldType))
    name = Column(String(128))
    # Start entries/graphs/correlations here
    created_at = Column(DateTime, default=datetime.utcnow)
    # Don't actually delete fields, unless it's the same day. Instead
    # stop entries/graphs/correlations here
    excluded_at = Column(DateTime)
    default_value = Column(Enum(DefaultValueTypes), default="value")
    default_value_value = Column(Float, default=None)
    target = Column(Boolean, default=False)
    # option{single_or_multi, options:[], ..}
    # number{float_or_int, ..}
    attributes = Column(JSON)
    # Used if pulling from external service
    service = Column(String(64))
    service_id = Column(String(64))

    user_id = Column(UUID, ForeignKey('users.id'))

    json_fields = """
    id
    name
    created_at
    excluded_at
    default_value_value
    target
    service
    service_id
    """

    def json(self):
        history = FieldEntry.query\
            .with_entities(FieldEntry.value, FieldEntry.created_at)\
            .filter_by(field_id=self.id)\
            .order_by(FieldEntry.created_at.asc())\
            .all()
        history = [
            dict(value=x.value, created_at=x.created_at)
            for x in history
            if x.value is not None
        ]

        return {
            **super().json(),
            'type': self.type.name,
            'default_value': self.default_value.name if self.default_value else "value",
            'avg': sum(x['value'] for x in history)/len(history) if history else 0.,
            'history': history
        }


class FieldEntry(Base, CustomBase):
    __tablename__ = 'field_entries'
    id = Column(UUID, primary_key=True, default=uuid_)
    value = Column(Float)  # TODO Can everything be a number? reconsider
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    user_id = Column(UUID, ForeignKey('users.id'), index=True)
    field_id = Column(UUID, ForeignKey('fields.id'))

    @staticmethod
    def get_today_entries(user_id, field_id=None):
        return FieldEntry.get_day_entries(datetime.now(), user_id, field_id)

    @staticmethod
    def get_day_entries(day, user_id, field_id=None):
        tz_ = User.query.filter_by(id=user_id)\
            .with_entities(User.timezone)\
            .first().timezone
        tz_ = tz_ or 'America/Los_Angeles'
        timezoned = func.Date(func.timezone(tz_, FieldEntry.created_at))
        day = day.astimezone(tz.gettz(tz_))
        # timezoned = func.Date(FieldEntry.created_at)

        q = FieldEntry.query\
            .filter(
                FieldEntry.user_id == user_id,
                timezoned == day.date()
            )
        if field_id:
            q = q.filter(FieldEntry.field_id == field_id)
        return q


class Person(Base, CustomBase):
    __tablename__ = 'people'
    id = Column(UUID, primary_key=True, default=uuid_)
    name = Column(String(128))
    relation = Column(String(128))
    issues = Column(Text)
    bio = Column(Text)

    user_id = Column(UUID, ForeignKey('users.id'), nullable=False)

    json_fields = """
    id
    name
    relation
    issues
    bio
    """


class Share(Base, CustomBase):
    __tablename__ = 'shares'
    id = Column(UUID, primary_key=True, default=uuid_)
    user_id = Column(UUID, ForeignKey('users.id'), index=True)
    email = Column(EmailType, index=True)

    fields = Column(Boolean)
    themes = Column(Boolean)
    profile = Column(Boolean)

    share_tags = relationship("ShareTag")
    tags = relationship("Tag", secondary="shares_tags")

    json_fields = """
    id
    user_id
    email
    fields
    themes
    profile
    """

    def json(self):
        return {
            **super().json(),
            'full_tags': {t.tag_id: True for t in self.share_tags if t.type.name == 'full'},
            'summary_tags': {t.tag_id: True for t in self.share_tags if t.type.name == 'summary'},
        }

class Tag(Base, CustomBase):
    __tablename__ = 'tags'
    id = Column(UUID, primary_key=True, default=uuid_)
    user_id = Column(UUID, ForeignKey('users.id'), index=True)
    name = Column(String(128), nullable=False)
    # Save user's selected tags between sessions
    selected = Column(Boolean)
    main = Column(Boolean, default=False)

    shares = relationship("Share", secondary="shares_tags")

    json_fields = """
    id
    user_id
    name
    selected
    main
    """

    @staticmethod
    def snoop(from_email, to_id):
        return Tag.query \
            .join(ShareTag, Share)\
            .filter(Share.email==from_email, Share.user_id == to_id)


# FIXME cascade https://www.michaelcho.me/article/many-to-many-relationships-in-sqlalchemy-models-flask
class EntryTag(Base, CustomBase):
    __tablename__ = 'entries_tags'
    entry_id = Column(UUID, ForeignKey('entries.id'), primary_key=True)
    tag_id = Column(UUID, ForeignKey('tags.id'), primary_key=True)


class ShareTagType(enum.Enum):
    full = 1
    summary = 2


class ShareTag(Base, CustomBase):
    __tablename__ = 'shares_tags'
    share_id = Column(UUID, ForeignKey('shares.id'), primary_key=True)
    tag_id = Column(UUID, ForeignKey('tags.id'), primary_key=True)
    type = Column(Enum(ShareTagType), nullable=False)

    tag = relationship(Tag, backref=backref("tags", cascade="all, delete-orphan"))
    share = relationship(Share, backref=backref("shares", cascade="all, delete-orphan"))
