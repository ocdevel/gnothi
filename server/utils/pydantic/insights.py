from typing import Optional, Any, Dict, List
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM


class LimitEntriesPost(BM):
    days: int
    tags: List[str] = None


class QuestionPost(LimitEntriesPost):
    question: str


class SummarizePost(LimitEntriesPost):
    words: int


class ThemesPost(LimitEntriesPost):
    algo: Optional[str] = 'agglomorative'


class SummarizeGet(BM):
    summary: str


class JobSubmitGet(BM):
    id: Optional[str] = None
    queue: Optional[int] = 0


class JobDone(BM_ORM):
    id: str
    method: str
    data_out: Dict


class TopBooksOut(BM_ORM):
    title: str
    author: Optional[str] = None
    topic: Optional[str] = None
    amazon: Optional[str] = None


class ShelfGet(BM):
    shelf: str


class ShelfPost(ShelfGet):
    id: str


class BookOut(TopBooksOut):
    id: str
    text: Optional[str] = None
