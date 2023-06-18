from typing import Any
from pydantic import BaseModel, UUID4
import orjson


def orjson_dumps(v, *, default):
    # orjson.dumps returns bytes, to match standard json.dumps we need to decode
    return orjson.dumps(v, default=default).decode()


class BM(BaseModel):
    class Config:
        json_loads = orjson.loads
        json_dumps = orjson_dumps


class BM_ID(BM):
    id: UUID4


class BM_ORM(BaseModel):
    class Config:
        json_loads = orjson.loads
        json_dumps = orjson_dumps
        orm_mode = True


class Valid(BM):
    valid: bool


default_privacies = 'username first_name last_name gender orientation birthday timezone bio'.split()


def apply_privacies(d, extra_privacies=[]):
    """
    This should be used in Pydantic.dict() overrides, after data's been fetched from DB before sent to client.
    It wipes out values if they're not specified in the share, and builds up a display_name
    """
    privacies = default_privacies + extra_privacies
    u, s, ug = d['user'], d['share'], d.get('user_group', {})
    s = s or {}
    for k in privacies:
        v = s.get(k, False)
        if v: u['profile'] = True
        else: u[k] = None
    u['display_name'] = (
        (u['first_name'] + " " + u['last_name']) if (u['first_name'] and u['last_name'])
        else u['first_name'] if u['first_name']
        else u['last_name'] if u['last_name']
        else u['username'] if u['username']
        else ug['username'] if ug.get('username', False)
        else u['email'] if u['email']
        else "Anonymous"
    )
    return d
