import asyncio
import sqlalchemy as sa
import common.models as M
from app import habitica
from common.errors import CantSnoop
from common.pydantic.utils import BM
import common.pydantic.users as PyU


class Habitica:
    @staticmethod
    async def _after_habitica(d):
        send = d.mgr.exec
        await asyncio.wait([
            send(d, action='users/user/get'),
            send(d, action='fields/fields/get')
        ])

    @staticmethod
    async def on_post(data: PyU.HabiticaIn, d):
        if d.snooping: raise CantSnoop()
        d.user.habitica_user_id = data.habitica_user_id
        d.user.habitica_api_token = data.habitica_api_token
        d.db.commit()
        habitica.sync_for(d.db, d.user)
        await Habitica._after_habitica(d)

    @staticmethod
    async def on_delete(data: BM, d):
        if d.snooping: raise CantSnoop()
        d.db.execute(sa.text("""
        update users set habitica_user_id=null, habitica_api_token=null where id=:uid;
        delete from fields where service='habitica' and user_id=:uid;
        """), dict(uid=d.viewer.id))
        d.db.commit()
        await Habitica._after_habitica(d)

    @staticmethod
    async def on_sync(data: BM, d):
        if d.snooping: raise CantSnoop()
        if not d.user.habitica_user_id:
            return {}
        habitica.sync_for(d.db, d.user)
        await Habitica._after_habitica(d)
