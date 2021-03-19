from typing import Optional, Any, Dict
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM


class SharePost(BM):
    email: str
    fields_: Optional[bool] = False
    books: Optional[bool] = False
    profile: Optional[bool] = False
    tags: Optional[dict] = {}

    class Config:
        fields = {'fields_': 'fields'}


class SharePut(SharePost):
    id: UUID4


class ShareGet(SharePut):
    user_id: UUID4

    class Config:
        fields = {'fields_': 'fields'}
        orm_mode = True
