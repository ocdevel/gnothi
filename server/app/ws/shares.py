import pdb, asyncio
from typing import List, Dict, Any
import common.models as M
from common.pydantic.utils import BM, BM_ID
from common.errors import CantSnoop, NotFound, GnothiException
import common.pydantic.shares as PyS
import sqlalchemy as sa
import sqlalchemy.orm as orm


class Shares:
    # @on_(f'{S}/shares.get') #, model_out=List[M.SOSharedWithMe])
    @staticmethod
    async def on_ingress_get(data: BM, d) -> List[PyS.Ingress]:
        return M.Share.ingress(d.db, d.vid)

    @staticmethod
    async def on_egress_get(data: BM, d) -> List[PyS.Egress]:
        return M.Share.egress(d.db, d.vid)

    @staticmethod
    async def on_email_check(data: PyS.EmailCheckPost, d) -> PyS.EmailCheckPost:
        if d.viewer.email == data.email:
            raise GnothiException(400, "PUNK", "That's you, silly!")
        res = (d.db.query(M.User.email)
            .filter_by(email=data.email)
            .scalar())
        if not res:
            raise NotFound("No Gnothi user with that email. Have them sign up first.")
        return dict(email=res)

    @staticmethod
    async def on_shares_post(data: PyS.SharePost, d) -> PyS.Valid:
        data = data.dict()
        data['users'].pop(d.viewer.email, None)
        M.Share.put_post_share(d.db, d.vid, data)
        exec = [d.mgr.exec(d, action='shares/egress/get')]
        for gid, v in data.get('groups', {}).items():
            exec.append(d.mgr.exec(d, action='groups/members/get', input=dict(id=gid), uids=True))
            exec.append(d.mgr.exec(d, action='groups/entries/get', input=dict(id=gid), uids=True))
        await asyncio.wait(exec)
        return dict(valid=True)

    @staticmethod
    async def on_share_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        d.db.query(M.Share).filter_by(user_id=d.vid, id=data.id).delete()
        d.db.commit()
        # FIXME this isn't getting received for some reason? (the others above work)
        await d.mgr.exec(d, action='shares/shares/get')
