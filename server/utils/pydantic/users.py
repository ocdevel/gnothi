from typing import Optional, Any
from pydantic import UUID4
import datetime
from common.pydantic.utils import BM, BM_ORM


class TimezoneIn(BM):
    timezone: Optional[str] = None


class AffiliateIn(BM):
    affiliate: Optional[str] = None

class ProfileIn(TimezoneIn):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    orientation: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[Any] = None
    bio: Optional[str] = None
    therapist: Optional[bool] = False


class ProfileOut(ProfileIn, BM_ORM):
    pass


class UserOut(BM_ORM):
    id: UUID4
    email: str
    timezone: Optional[Any] = None
    habitica_user_id: Optional[str] = None
    habitica_api_token: Optional[str] = None
    is_cool: Optional[bool] = False
    paid: Optional[bool] = False
    affiliate: Optional[str] = None


class PersonIn(BM):
    name: Optional[str] = None
    relation: Optional[str] = None
    issues: Optional[str] = None
    bio: Optional[str] = None


class PersonPut(PersonIn):
    id: UUID4


class PersonOut(PersonPut, BM_ORM):
    pass


class CheckUsernameIn(BM):
    username: str


class CheckUsernameOut(BM):
    valid: bool
