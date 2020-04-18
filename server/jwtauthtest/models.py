import enum, pdb
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
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils.types import EmailType
from uuid import uuid4


def uuid_():
    return str(uuid4())


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True, default=uuid_)
    # https://stackoverflow.com/a/574698/362790
    username = Column(EmailType, nullable=False, unique=True)
    password = Column(String(200), nullable=False)

    habitica_user_id = Column(String(200))
    habitica_api_token = Column(String(200))

    entries = relationship("Entry", order_by='Entry.created_at.desc()')
    field_entries = relationship("FieldEntry", order_by='FieldEntry.created_at.desc()')
    fields = relationship("Field", order_by='Field.created_at.asc()')
    family_members = relationship("Family")
    shares = relationship("Share")

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
            'id': self.id,
            'username': self.username,
            'habitica_user_id': self.habitica_user_id,
            'habitica_api_token': self.habitica_api_token,
            'shared_with_me': [s.json() for s in self.shared_with_me()]
        }


class Entry(Base):
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

    # Static fields (not user-generated)
    show_therapist = Column(Boolean)
    show_ml = Column(Boolean)

    user_id = Column(UUID, ForeignKey('users.id'))

    def run_models(self):
        self.title_summary = ml.summarize(self.text, 5, 20)
        self.text_summary = ml.summarize(self.text, 32, 128)
        self.sentiment = ml.sentiment(self.text)


    # TODO look into https://stackoverflow.com/questions/7102754/jsonify-a-sqlalchemy-result-set-in-flask
    #                https://stackoverflow.com/questions/5022066/how-to-serialize-sqlalchemy-result-to-json
    # Marshmallow    https://marshmallow-sqlalchemy.readthedocs.io/en/latest/
    def json(self):
        return {
            'id': self.id,
            'title': self.title,
            'text': self.text,
            'created_at': self.created_at,
            'title_summary': self.title_summary,
            'text_summary': self.text_summary,
            'sentiment': self.sentiment
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


class Field(Base):
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
            'id': self.id,
            'type': self.type.name,
            'name': self.name,
            'created_at': self.created_at,
            'excluded_at': self.excluded_at,
            'default_value': self.default_value.name if self.default_value else "value",
            'default_value_value': self.default_value_value,
            'target': self.target,
            'service': self.service,
            'service_id': self.service_id,

            'avg': sum(x['value'] for x in history)/len(history) if history else 0.,
            'history': history
        }


class FieldEntry(Base):
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
        # FIXME handle this automatically, or as user timzeone preference, or such
        timezoned = func.Date(func.timezone('America/Los_Angeles', FieldEntry.created_at))
        day = day.astimezone(tz.gettz('America/Los_Angeles'))
        # timezoned = func.Date(FieldEntry.created_at)

        q = FieldEntry.query\
            .filter(
                FieldEntry.user_id == user_id,
                timezoned == day.date()
            )
        if field_id:
            q = q.filter(FieldEntry.field_id == field_id)
        return q



class FamilyType(Base):
    __tablename__ = 'family_types'
    id = Column(UUID, primary_key=True, default=uuid_)
    name = Column(String(128))


class Family(Base):
    __tablename__ = 'family'
    id = Column(UUID, primary_key=True, default=uuid_)
    name = Column(String(128))  # Brett, Lara, ..
    family_type_id = Column(UUID, ForeignKey('family_types.id'), nullable=False)
    user_id = Column(UUID, ForeignKey('users.id'), nullable=False)
    notes = Column(Text)


class FamilyIssueType(Base):
    __tablename__ = 'family_issue_types'
    id = Column(UUID, primary_key=True, default=uuid_)
    name = Column(String(128), nullable=False)

class FamilyIssue(Base):
    __tablename__ = 'family_issues'
    family_id = Column(UUID, ForeignKey('family.id'), primary_key=True)
    family_issue_type_id = Column(UUID, ForeignKey('family_issue_types.id'), primary_key=True)


class Share(Base):
    __tablename__ = 'shares'
    user_id = Column(UUID, ForeignKey('users.id'), primary_key=True)
    email = Column(EmailType, primary_key=True)

    entries = Column(Boolean)
    summaries = Column(Boolean)
    fields = Column(Boolean)
    themes = Column(Boolean)
    profile = Column(Boolean)

    def json(self):
        return {
            'user_id': self.user_id,
            'email': self.email,
            'entries': self.entries,
            'summaries': self.summaries,
            'fields': self.fields,
            'themes': self.themes,
            'profile': self.profile
        }
