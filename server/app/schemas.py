import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel
import app.models as M


class Out(BaseModel):
    class Config:
        orm_mode = True


class UserIn(BaseModel):
    username: str
    password: str


class UserOut(Out):
    id: Any
    email: Any
    habitica_user_id: Optional[str] = None
    habitica_api_token: Optional[str] = None
    shared_with_me: Any


class TimezoneIn(BaseModel):
    timezone: Optional[str] = None


class HabiticaIn(BaseModel):
    habitica_user_id: Optional[str] = None
    habitica_api_token: Optional[str] = None


class ProfileIn(TimezoneIn):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    orientation: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[Any] = None
    bio: Optional[str] = None


class ProfileOut(ProfileIn, Out):
    pass


class EntryIn(BaseModel):
    title: Optional[str] = None
    text: str
    tags: dict


class EntryOut(Out):
    id: str
    title: Optional[str] = None
    text: str
    created_at: Optional[datetime.datetime] = None
    title_summary: str
    text_summary: str
    sentiment: Optional[str] = ''
    entry_tags: Dict


class FieldExclude(BaseModel):
    excluded_at: Optional[datetime.datetime] = None


class Field(FieldExclude):
    type: str
    name: str
    default_value: str
    default_value_value: Optional[float] = None
    target: bool

## TODO can't get __root__ setup working
# class FieldOut(Out):
#     id: str
#     type: M.FieldType
#     name: str
#     created_at: Optional[Any] = None
#     excluded_at: Optional[Any] = None
#     default_value: Optional[M.DefaultValueTypes] = M.DefaultValueTypes.value
#     default_value_value: Optional[float] = None
#     target: Optional[bool] = False
#     service: Optional[str] = None
#     service_id: Optional[str] = None
#     history: Any
#
#
# class FieldsOut(Out):
#     __root__: Dict[str, FieldOut]


class FieldEntry(BaseModel):
    value: float


class PersonIn(BaseModel):
    name: Optional[str] = None
    relation: Optional[str] = None
    issues: Optional[str] = None
    bio: Optional[str] = None


class PersonOut(PersonIn, Out):
    pass


class ShareIn(BaseModel):
    email: str
    fields_: Optional[bool] = False
    books: Optional[bool] = False
    profile: Optional[bool] = False
    tags: Optional[dict] = {}

    class Config:
        fields = {'fields_': 'fields'}


class ShareOut(ShareIn):
    id: str

    class Config:
        fields = {'fields_': 'fields'}
        orm_mode = True


class TagIn(BaseModel):
    name: str
    selected: Optional[bool] = False


class TagOut(TagIn, Out):
    id: str
    user_id: str
    name: str
    selected: Optional[bool] = False
    main: Optional[bool] = False


class LimitEntries(BaseModel):
    days: int
    tags: List[str] = None


class Question(LimitEntries):
    query: str


class Summarize(LimitEntries):
    words: int
