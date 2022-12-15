from typing import Optional, Any, Dict, List
from pydantic import UUID4
import datetime

import common.models
from common.pydantic.utils import BM, BM_ORM, apply_privacies
import common.models as M
from common.pydantic.shares import ShareGet, ProfileIngress


class GroupPost(BM):
    title: str
    text_short: Optional[str] = ""
    text_long: Optional[str] = ""
    privacy: M.GroupPrivacy

    perk_member: Optional[float] = None
    perk_member_donation: Optional[bool] = False
    perk_entry: Optional[float] = None
    perk_entry_donation: Optional[bool] = False
    perk_video: Optional[float] = None
    perk_video_donation: Optional[bool] = False


class GroupPut(GroupPost):
    id: UUID4


class GroupOut(GroupPost, BM_ORM):
    id: UUID4
    owner_id: UUID4
    created_at: datetime.datetime
    members: Optional[Dict[str, str]] = {}
    role: Optional[M.GroupRoles] = None

    n_members: Optional[int] = 1
    n_messages: Optional[int] = 0
    last_message: Optional[datetime.datetime] = None
    owner_name: Optional[str] = None


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
    role: M.GroupRoles
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


class GroupInvitePost(BM):
    id: UUID4
    email: str


class MemberModifyPost(BM):
    id: UUID4
    user_id: UUID4
    role: Optional[M.GroupRoles] = None
    remove: Optional[bool] = False
