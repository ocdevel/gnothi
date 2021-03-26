from typing import Optional, List, Dict, Any
from common.pydantic.utils import BM
from pydantic import UUID4
from sqlalchemy.orm import Session


class MessageIn(BM):
    action: str
    jwt: str
    as_user: Optional[UUID4] = None
    data: Optional[Dict] = {}


class MessageOut(BM):
    action: str
    error: Optional[str] = None
    detail: Optional[str] = None
    code: Optional[int] = 200
    data: Optional[Any] = {}
    # ID of the primary object being requested, if necessary
    id: Optional[str] = None


class JobStatusOut(BM):
    status: str
