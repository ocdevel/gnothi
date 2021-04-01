from typing import Optional, Any, Dict, List
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM, apply_privacies
from common.models import GroupPrivacy, GroupRoles
from common.pydantic.shares import ShareGet, ProfileIngress


class GroupPost(BM):
    title: str
    text_short: Optional[str] = ""
    text_long: Optional[str] = ""
    privacy: GroupPrivacy


class GroupPut(GroupPost):
    id: UUID4


class GroupOut(GroupPost, BM_ORM):
    id: UUID4
    owner_id: UUID4
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

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d['group_id'] = d.pop('obj_id', None)
        return d


class UserGroupOut(BM_ORM):
    username: str
    joined_at: datetime.datetime
    role: GroupRoles
    online: bool


class MembersOut(BM):
    user: ProfileIngress
    share: Optional[ShareGet] = {}
    user_group: UserGroupOut

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        apply_privacies(d, extra_privacies=['email'])
        return d


class GroupWrapOut(BM):
    id: UUID4
    data: Any


class PrivacyIn(BM):
    id: UUID4
    key: str
    value: bool
