from typing import Optional, Any, Dict
from pydantic import UUID4
from common.pydantic.utils import BM, BM_ORM


class TagIn(BM):
    id: Optional[UUID4] = None
    name: str
    selected: Optional[bool] = False


class TagPut(TagIn):
    id: UUID4


class TagId(BM):
    id: UUID4


class TagOut(TagIn, BM_ORM):
    id: UUID4
    user_id: UUID4
    name: str
    selected: Optional[bool] = False
    main: Optional[bool] = False
