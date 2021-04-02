from typing import Optional, List, Dict, Any
from common.pydantic.utils import BM
from pydantic import UUID4
from sqlalchemy.orm import Session


class MessageIn(BM):
    action: str
    jwt: str
    as_user: Optional[UUID4] = None
    data: Optional[Dict] = {}


class ResWrap(BM):
    """
    Wraps WS responses in case extra info is needed.
    """
    data: Any
    id: Optional[UUID4] = None
    keyby: Optional[str] = None
    op: Optional[str] = None
    action_as: Optional[str] = None
    uids: Optional[List[str]] = None


class MessageOut(ResWrap):
    action: str
    error: Optional[str] = None
    detail: Optional[str] = None
    code: Optional[int] = 200
    data: Optional[Any] = {}


class JobStatusOut(BM):
    status: str
