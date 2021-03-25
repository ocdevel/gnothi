from typing import Optional, Any, Dict
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM
from common.models import NoteTypes


class Entry(BM):
    title: Optional[str] = None
    text: str
    no_ai: Optional[bool] = False


class EntryPost(Entry):
    tags: dict
    created_at: Optional[str] = None


class EntryPut(EntryPost):
    id: UUID4


class EntryGet(Entry, BM_ORM):
    id: UUID4
    created_at: datetime.datetime
    ai_ran: Optional[bool] = None
    title_summary: Optional[str] = None
    text_summary: Optional[str] = None
    sentiment: Optional[str] = None
    entry_tags: Dict[str, bool]


class NoteGet(BM):
    entry_id: Optional[UUID4] = None


class NotePost(NoteGet):
    entry_id: UUID4
    type: NoteTypes
    text: str
    private: bool


class NoteOut(BM_ORM, NotePost):
    id: UUID4
    user_id: UUID4
    created_at: datetime.datetime


class CacheEntryGet(BM_ORM):
    paras: Any
