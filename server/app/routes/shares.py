import pdb
from typing import List, Dict, Any
import common.models as M
from common.pydantic.utils import BM, BM_ID
from app.utils.errors import CantSnoop
import common.pydantic.shares as PyS


class Shares:
    @staticmethod
    async def on_get(data: BM, d) -> List[PyS.ShareGet]:
        if d.snooping: raise CantSnoop()
        return d.db.query(M.Share).filter_by(user_id=d.user.id).all()

    @staticmethod
    async def _shares_put_post(d, data, share_id=None):
        vid, db, send = d.vid, d.db, d.mgr.send_other
        data = data.dict()
        tags = data.pop('tags')
        data['fields'] = data['fields_'];
        del data['fields_']  # pydantic conflict
        if share_id:
            s = db.query(M.Share).filter_by(user_id=vid, id=share_id).first()
            db.query(M.ShareTag).filter_by(share_id=s.id).delete()
            for k, v in data.items():
                setattr(s, k, v)
        else:
            s = M.Share(user_id=vid, **data)
            db.add(s)
        db.commit()
        for tag, v in tags.items():
            if not v: continue
            db.add(M.ShareTag(share_id=vid, tag_id=tag))
        db.commit()
        await send('shares/get', {}, d)

    @staticmethod
    async def on_post(data: PyS.SharePost, d):
        # background_tasks.add_task(ga, viewer.id, 'feature', 'share')
        if d.snooping: raise CantSnoop()
        await Shares._shares_put_post(d, data)

    @staticmethod
    async def on_put(data: PyS.SharePut, d):
        if d.snooping: raise CantSnoop()
        await Shares._shares_put_post(d, data, share_id=data.id)

    @staticmethod
    async def on_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        d.db.query(M.Share).filter_by(user_id=d.vid, id=data.id).delete()
        d.db.commit()
        # FIXME this isn't getting received for some reason? (the others above work)
        await d.mgr.send_other('shares/get', {}, d)
