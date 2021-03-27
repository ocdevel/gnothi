import hashlib, requests, pdb
from aioify import aioify
from app.mail import send_mail
from common.utils import vars, is_dev
from common.database import with_db
from sqlalchemy import text
from typing import Union, Dict
from pydantic import UUID4

DEBUG = is_dev()
def ga(data, d):
    """
    I'm only tracking interesting server-side events right now (no cookies), I want to see what features
    are being used and important bits like sign-ups & book-thumbs. user-id is obfuscated
    https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
    """
    split = d.message.action.split('/')
    category = split[0]
    action = '/'.join(split[1:])

    # actually don't care about uid, just need a unique identifier. Note this is
    # a 1-way hash (right?), so I can't even decrypt - just want unique per-feature track
    uid_ = str(d.vid).encode()  # to bytes
    uid_ = hashlib.sha256(uid_).hexdigest()
    url = "https://ssl.google-analytics.com/"
    url += "debug/collect" if DEBUG else "collect"
    res = requests.post(url, params=dict(
        v=1,
        tid=vars.GA,
        cid=uid_,
        t='event',
        ec=category,
        ea=action
    ))
    # if DEBUG: print(res.json())

    interesting = action in [
        'users/register',  # TODO
        'insights/books/post',
        'entries/notes/post',
        'entries/entries/post',
    ]
    if action == 'users/profile/put' and data.get('therapist', None):
        interesting = True
    if not interesting: return

    # if d.db.execute(text("""
    # select is_superuser su from users where id=:uid
    # """), dict(uid=d.vid)).fetchone().su:
    #     # don't notify of my own or Lisa's entries
    #     # return
    #     pass
    send_mail('tylerrenelle@gmail.com', 'action', dict(category=category, action=action))
