import datetime
from typing import Optional, List
from pydantic import BaseModel


class Reg(BaseModel):
    username: str
    password: str


class ProfileTimezone(BaseModel):
    timezone: Optional[str] = None


class ProfileHabitica(BaseModel):
    habitica_user_id: Optional[str] = None
    habitica_api_token: Optional[str] = None


class Profile(ProfileHabitica, ProfileTimezone):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    orientation: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    bio: Optional[str] = None


class Entry(BaseModel):
    title: Optional[str] = None
    text: str
    tags: dict


class FieldExclude(BaseModel):
    excluded_at: Optional[datetime.datetime] = None


class Field(FieldExclude):
    type: str
    name: str
    default_value: str
    default_value_value: Optional[str] = None
    target: bool


class FieldEntry(BaseModel):
    value: float


class Person(BaseModel):
    name: Optional[str] = None
    relation: Optional[str] = None
    issues: Optional[str] = None
    bio: Optional[str] = None


class Share(BaseModel):
    email: str
    fields_: Optional[bool] = False
    books: Optional[bool] = False
    profile: Optional[bool] = False
    tags: Optional[dict] = {}

    class Config:
        fields = {'fields_': 'fields'}


class Tag(BaseModel):
    name: str
    selected: Optional[bool] = False


class LimitEntries(BaseModel):
    days: int
    tags: List[str] = None


class Question(LimitEntries):
    query: str


class Summarize(LimitEntries):
    words: int
