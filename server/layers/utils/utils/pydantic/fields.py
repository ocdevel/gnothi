from typing import Optional, Any, Dict
from pydantic import UUID4
import datetime
from utils.pydantic.utils import BM, BM_ORM
from data.models import DefaultValueTypes, FieldType


class FieldExcludeIn(BM):
    id: UUID4
    excluded_at: Optional[datetime.datetime] = None


class FieldPost(BM):
    type: FieldType
    name: str
    default_value: DefaultValueTypes
    default_value_value: Optional[float] = None


class FieldPut(FieldPost):
    id: UUID4


class FieldHistoryOut(BM_ORM):
    value: float
    created_at: datetime.datetime


# TODO can't get __root__ setup working
class FieldOut(BM_ORM):
    id: UUID4
    type: FieldType
    name: str
    created_at: Optional[datetime.datetime] = None
    excluded_at: Optional[datetime.datetime] = None
    default_value: Optional[DefaultValueTypes] = DefaultValueTypes.value
    default_value_value: Optional[float] = None
    service: Optional[str] = None
    service_id: Optional[str] = None
    avg: Optional[float] = 0.
    influencer_score: Optional[float] = 0.
    next_pred: Optional[float] = 0.

# class FieldsOut(BM_ORM):
#     __root__: Dict[UUID4, FieldOut]
FieldsOut = Dict[str, FieldOut]


class FieldEntryIn(BM):
    id: UUID4
    value: float
    day: Optional[str] = None


class FieldEntryPickIn(BM):
    value: float
    day: str


class FieldEntriesIn(BM):
    day: Optional[str] = None


class FieldEntryOut(BM_ORM):
    field_id: UUID4
    day: datetime.date
    value: float
