import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, UUID4
# import app.models as M
from fastapi_users import models


class FU_User(models.BaseUser): pass
class FU_UserCreate(models.BaseUserCreate): pass
class FU_UserUpdate(FU_User, models.BaseUserUpdate): pass
class FU_UserDB(FU_User, models.BaseUserDB): pass


class Out(BaseModel):
    class Config:
        orm_mode = True


class UserOut(FU_User, models.BaseUserDB):
    timezone: Optional[Any] = None
    habitica_user_id: Optional[str] = None
    habitica_api_token: Optional[str] = None
    shared_with_me: Optional[Any]


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
    no_ai: Optional[bool] = False
    created_at: Optional[str] = None


class EntryOut(Out):
    id: UUID4
    title: Optional[str] = None
    text: str
    created_at: Optional[datetime.datetime] = None
    title_summary: Optional[str] = None
    text_summary: Optional[str] = None
    sentiment: Optional[str] = ''
    no_ai: Optional[bool] = False
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
    id: UUID4
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
    id: UUID4

    class Config:
        fields = {'fields_': 'fields'}
        orm_mode = True


class TagIn(BaseModel):
    name: str
    selected: Optional[bool] = False


class TagOut(TagIn, Out):
    id: UUID4
    user_id: UUID4
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
