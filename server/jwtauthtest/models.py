from jwtauthtest.database import Base
from sqlalchemy import Column, Integer, String, Text


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(200), nullable=False)

    def __init__(self, username, password):
        self.username = username
        self.password = password

    def __repr__(self):
        return f'<User {{ username: {self.username}, password: {self.password} }}'


class Entry(Base):
    __tablename__ = 'entries'

    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)


class MetaField(Base):
    __tablename__ = 'meta_fields'

    id = Column(Integer, primary_key=True)
    type = [numeric, 5_star, bool, ...]
    # References user


class MetaEntries(Base):
    __tablename__ = 'meta_entries'

    id = Column(Integer, primary_key=True)
    value = ??
    # References Entry, MetaField
