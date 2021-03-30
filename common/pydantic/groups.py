from typing import Optional, Any, Dict, List
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM
from common.models import GroupPrivacy, GroupRoles


class GroupIn(BM):
    title: str
    text_short: Optional[str] = ""
    text_long: Optional[str] = ""
    privacy: GroupPrivacy


class GroupOut(GroupIn, BM_ORM):
    id: UUID4
    owner: UUID4
    privacy: GroupPrivacy
    created_at: datetime.datetime
    members: Optional[Dict[str, str]] = {}
    role: Optional[GroupRoles] = None


class MessageIn(BM):
    id: UUID4
    text: str


class MessageOut(BM_ORM):
    id: UUID4
    owner_id: Optional[UUID4] = None
    user_id: Optional[UUID4] = None
    group_id: Optional[UUID4] = None
    # recipient_type
    created_at: datetime.datetime
    updated_at: datetime.datetime
    text: str


class MemberOut(BM_ORM):
    id: UUID4
    username: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    show_bio: Optional[str] = None
    joined_at: datetime.datetime
    role: GroupRoles
    online: bool

MembersOut = Dict[str, MemberOut]


class GroupWrapOut(BM):
    id: UUID4
    data: Any


class PrivacyIn(BM):
    id: UUID4
    key: str
    value: bool
