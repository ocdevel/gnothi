import pdb, re, datetime, logging, boto3, io
from typing import List
from fastapi import Depends, BackgroundTasks
from app.app_app import app
from app.app_jwt import jwt_user
from fastapi_sqlalchemy import db
import sqlalchemy as sa
import common.models as M
from app.google_analytics import ga
from app.utils import getuser, cant_snoop, send_error
from app.socketio import on_, sio, CantSnoop, to_io, SocketError

logger = logging.getLogger(__name__)

S = "server/users"
C = "client/users"


@on_(f'{S}/user.get')
async def on_user_get(sid, data, d):
    if d.snooping: raise CantSnoop()  # FIXME not handling this?
    return to_io(d.user, M.SOUser)


@on_(f'{S}/shares.get') #, model_out=List[M.SOSharedWithMe])
async def on_shares_get(sid, data, d):
    res = M.Share.shared_with_me(d.viewer.email)
    res = to_io(res, M.SOSharedWithMe, multi=True)
    return res


#TODO remove
@app.get('/user/checkin')
def checkin_get(
    background_tasks: BackgroundTasks,
    viewer: M.User = Depends(jwt_user),
):
    background_tasks.add_task(ga, viewer.id, 'user', 'checkin')
    sql = sa.text(f"update users set updated_at=now() where id=:uid")
    db.session.execute(sql, {'uid': viewer.id})
    db.session.commit()
    return {}


def check_username(username, d):
    res = d.sess.execute(sa.text("""
    select 1 from users where username=:username and id!=:uid
    """), dict(username=username, uid=d.uid)).first()
    if res: return False
    return True

@on_(f"{S}/check-username")
async def on_check_username(sid, username, d):
    valid = check_username(username, d)
    return {"valid": valid}


async def profile_get(sid, user):
    res = to_io(user, M.SOProfile)
    await sio.emit(f"{C}/profile", res, to=sid)


@on_(f'{S}/profile.get') # , model_out=M.SOProfile)
async def on_profile_get(sid, data, d):
    if d.snooping and not d.user.share_data.profile:
        raise CantSnoop()
    await profile_get(sid, d.user)


@on_(f'{S}/profile.put', model_out=M.SOProfile, model_in=M.SIProfile)
async def on_profile_put(sid, data, d):
    if d.snooping: raise CantSnoop()
    if data.username and not check_username(data.username, d):
        raise SocketError(401, "USERNAME_TAKEN", "That username is already taken, try another")
    if data.therapist and not d.viewer.therapist:
        ga(d.uid, 'user', 'therapist')
    for k, v in data.dict().items():
        if k == 'paid': continue
        v = v or None  # remove empty strings
        setattr(d.viewer, k, v)
    d.sess.commit()
    if data.bio:
        M.Job.create_job(method='profiles', data_in={'args': [d.uid]})
    await profile_get(sid, d.viewer)


@app.get('/people', response_model=List[M.SOPerson])
def people_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user.people


@app.post('/people')
def people_post(data: M.SIPerson, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    p = M.Person(**data.dict())
    user.people.append(p)
    db.session.commit()
    return {}


@app.put('/people/{person_id}')
def person_put(data: M.SIPerson, person_id: str, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    # TODO and share_id = ...
    p = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id).first()
    for k, v in data.dict().items():
        setattr(p, k, v)
    db.session.commit()
    return {}


@app.delete('/people/{person_id}')
def person_delete(person_id: str, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    pq = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id)
    pq.delete()
    db.session.commit()
    return {}

users_router = None
