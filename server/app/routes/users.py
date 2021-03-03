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
from app.socketio import on_, sio, CantSnoop

logger = logging.getLogger(__name__)

S = "server/users"
C = "client/users"


#TODO
@app.get('/user', response_model=M.SOUser)
def user_get(as_user: str = None,  viewer = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()  # FIXME not handling this?
    return user


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


async def profile_get(sid, user):
    res = M.to_json(user, M.SOProfile)
    await sio.emit(f"{C}/profile", res, to=sid)


@on_(f'{S}/profile.get', viewer=True) # , model_out=M.SOProfile)
async def on_profile_get(sid, data, d):
    if d.snooping and not d.user.share_data.profile:
        raise CantSnoop()
    await profile_get(sid, d.user)


@on_(f'{S}/profile.timezone.put', viewer=True, model_in=M.SITimezone)
async def on_profile_timezone_put(sid, data, d):
    if d.snooping: raise CantSnoop()
    d.viewer.timezone = data.timezone
    d.sess.commit()
    await profile_get(sid, d.viewer)


@on_(f'{S}/profile.put', viewer=True, model_out=M.SOProfile, model_in=M.SIProfile)
async def on_profile_put(sid, data, d):
    if data.therapist:
        ga(d.uid, 'user', 'therapist')
    if d.snooping: raise CantSnoop()
    for k, v in data.dict().items():
        v = v or None  # remove empty strings
        if k == 'paid': continue
        setattr(d.viewer, k, v)
    d.sess.commit()
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
