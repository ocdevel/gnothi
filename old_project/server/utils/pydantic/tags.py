from typing import Optional, Any, Dict, List
from pydantic import UUID4
from common.pydantic.utils import BM, BM_ORM


class TagIn(BM):
    id: Optional[UUID4] = None
    name: str
    selected: Optional[bool] = False
    ai: Optional[bool] = True


class TagPut(BM):
    id: UUID4
    name: str
    ai: bool


class TagId(BM):
    id: UUID4


class TagOut(TagIn, BM_ORM):
    id: UUID4
    user_id: UUID4
    name: str
    selected: Optional[bool] = False
    main: Optional[bool] = False


class TagOrder(BM):
    id: UUID4
    sort: int


TagsOrder = List[TagOrder]
