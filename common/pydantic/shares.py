from typing import Optional, Any, Dict, List
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM


class User(BM_ORM):
    id: UUID4
    email: str
    username: Optional[str] = None


class Group(BM_ORM):
    id: UUID4
    title: str


class Share(BM):
    id: Optional[UUID4] = None

    fields_: Optional[bool] = False
    books: Optional[bool] = False
    # profile: Optional[bool] = False

    email: Optional[bool] = False
    username: Optional[bool] = False
    first_name: Optional[bool] = False
    last_name: Optional[bool] = False
    gender: Optional[bool] = False
    orientation: Optional[bool] = False
    birthday: Optional[bool] = False
    timezone: Optional[bool] = False
    bio: Optional[bool] = False

    class Config:
        fields = {'fields_': 'fields'}

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d['fields'] = d.pop('fields_')
        return d


class SharePost(BM):
    share: Share
    tags: Dict[str, bool]
    users: Dict[str, bool]
    groups: Dict[str, bool]


class ShareGet(Share, BM_ORM):
    pass


class SharesGet(BM_ORM):
    share: ShareGet
    tags: Optional[List[Any]] = []
    users: Optional[List[Any]] = []
    groups: Optional[List[Any]] = []


class EmailCheckPost(BM):
    email: str


class Valid(BM):
    valid: bool
