from jwtauthtest.database import Base
from sqlalchemy import Column, Integer, String, Text, Enum, Float, ForeignKey, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
import enum, datetime

def uuid_():
    return str(uuid4())

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True, default=uuid_)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(200), nullable=False)

    entries = relationship("Entry", order_by='Entry.created_at.desc()')
    fields = relationship("Field")
    family_members = relationship("Family")

    def __init__(self, username, password):
        self.username = username
        self.password = password

    def __repr__(self):
        return f'<User {{ username: {self.username}, password: {self.password} }}'


class Entry(Base):
    __tablename__ = 'entries'

    id = Column(UUID, primary_key=True, default=uuid_)
    # Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
    title = Column(String(128))
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Static fields (not user-generated)
    show_therapist = Column(Boolean)
    show_ml = Column(Boolean)

    field_entries = relationship("FieldEntry", order_by="FieldEntry.field_id")
    user_id = Column(UUID, ForeignKey('users.id'))

    def __init__(self, title, text):
        self.title = title
        self.text = text

    # TODO look into https://stackoverflow.com/questions/7102754/jsonify-a-sqlalchemy-result-set-in-flask
    #                https://stackoverflow.com/questions/5022066/how-to-serialize-sqlalchemy-result-to-json
    # Marshmallow    https://marshmallow-sqlalchemy.readthedocs.io/en/latest/
    def json(self):
        return {
            'id': self.id,
            'title': self.title,
            'text': self.text,
            'created_at': self.created_at,
            'fields': {f.field_id: f.value for f in self.field_entries}
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Don't actually delete fields, unless it's the same day. Instead
    # stop entries/graphs/correlations here
    deleted_at = Column(DateTime)
    # option{single_or_multi, options:[], ..}
    # number{float_or_int, ..}
    attributes = Column(JSON)
    # Used if pulling from external service
    service = Column(String(64))
    service_id = Column(String(64))
    service_exclude = Column(Boolean, default=False)

    user_id = Column(UUID, ForeignKey('users.id'))

    def json(self):
        return {
            'id': self.id,
            'type': self.type.name,
            'name': self.name,
            'created_at': self.created_at,
            'service': self.service,
            'service_id': self.service_id,
            'service_exclude': self.service_exclude
        }


class FieldEntry(Base):
    __tablename__ = 'field_entries'
    value = Column(Float)  # TODO Can everything be a number? reconsider

    entry_id = Column(UUID, ForeignKey('entries.id'), primary_key=True)
    field_id = Column(UUID, ForeignKey('fields.id'), primary_key=True)

    def __init__(self, value, field_id):
        self.value = value
        self.field_id = field_id


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
