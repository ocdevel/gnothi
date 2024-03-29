import pdb, re, datetime, logging, boto3, io, asyncio
from typing import List
import sqlalchemy as sa
import common.models as M
from common.errors import CantSnoop, GnothiException
from common.pydantic.utils import BM, BM_ID
from common.pydantic.ws import ResWrap
import common.pydantic.users as PyU

logger = logging.getLogger(__name__)


class Users:
    @staticmethod
    async def on_user_everything(data: BM, d):
        routes = [
            'tags/tags/get',
            'entries/entries/get',
            'entries/notes/get',
            'fields/fields/get',
            'fields/field_entries/get',
            # These are pulled for viewer, not user
            'notifs/notes/get',
            'notifs/groups/get',
            'users/profile/get'
        ]
        if not d.snooping:
            routes += [
                'users/user/get',
                'fields/field_entries/has_dupes/get',
                'shares/ingress/get',
                'groups/mine/get'
            ]
        await asyncio.wait([
            d.mgr.exec(d, action=r)
            for r in routes
        ])

    @staticmethod
    async def on_user_get(data: BM, d) -> PyU.UserOut:
        if d.snooping: raise CantSnoop()  # FIXME not handling this?
        return d.user

    @staticmethod
    async def on_check_username(data: PyU.CheckUsernameIn, d) -> PyU.CheckUsernameOut:
        valid = Users._check_username(data.username, d)
        return {"valid": valid}

    @staticmethod
    async def on_profile_get(data: BM, d) -> PyU.ProfileOut:
        if d.snooping and not d.user.share_data.profile:
            raise CantSnoop()
        return d.user

    @staticmethod
    async def on_profile_put(data: PyU.ProfileIn, d) -> PyU.ProfileOut:
        if d.snooping: raise CantSnoop()
        if data.username and not Users._check_username(data.username, d):
            raise GnothiException(401, "USERNAME_TAKEN", "That username is already taken, try another")
        #if data.therapist and not d.viewer.therapist:
        #    ga(d.vid, 'user', 'therapist')
        # PyU.ProfileIn ensures they can only set safe values
        for k, v in data.dict().items():
            setattr(d.viewer, k, v)
        d.db.commit()
        if data.bio:
            M.Job.create_job(d.db, user_id=d.vid, method='profiles', data_in={'args': [d.vid]})
        return d.viewer

    @staticmethod
    async def on_timezone_put(data: PyU.TimezoneIn, d) -> PyU.ProfileOut:
        d.viewer.timezone = data.timezone
        d.db.commit()
        return ResWrap(data=d.viewer, action_as='users/profile/get')

    @staticmethod
    async def on_affiliate_put(data: PyU.AffiliateIn, d):
        d.viewer.affiliate = data.affiliate
        d.db.commit()

    @staticmethod
    async def on_therapists_get(data: BM, d) -> List[PyU.ProfileOut]:
        # FIXME not yet implemented
        return []
        if d.snooping: raise CantSnoop()
        return d.db.query(M.User) \
            .join(M.ProfileMatch, M.User.id == M.ProfileMatch.match_id) \
            .filter(M.ProfileMatch.user_id == d.user.id) \
            .order_by(M.ProfileMatch.score.asc()) \
            .all()

    @staticmethod
    def _check_username(username, d):
        res = d.db.execute(sa.text("""
        select 1 from users where username=:username and id!=:uid
        """), dict(username=username, uid=d.vid)).first()
        if res: return False
        return True

    @staticmethod
    async def on_people_get(data: BM, d) -> List[PyU.PersonOut]:
        if d.snooping and not d.user.share_data.profile:
            raise CantSnoop("people")
        return d.user.people

    @staticmethod
    async def on_people_post(data: PyU.PersonIn, d):
        if d.snooping: raise CantSnoop()
        p = M.Person(**data.dict())
        d.user.people.append(p)
        d.db.commit()
        await d.mgr.exec(d, action="users/people/get")

    @staticmethod
    async def on_person_put(data: PyU.PersonPut, d):
        if d.snooping: raise CantSnoop()
        # TODO and share_id = ...
        p = d.db.query(M.Person).filter_by(user_id=d.vid, id=data.id).first()
        for k, v in data.dict().items():
            if k == 'id': continue
            setattr(p, k, v)
        d.db.commit()
        await d.mgr.exec(d, action="users/people/get")


    @staticmethod
    async def on_person_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        pq = d.db.query(M.Person).filter_by(user_id=d.vid, id=data.id)
        pq.delete()
        d.db.commit()
        await d.mgr.exec(d, action="users/people/get")

users_router = None
