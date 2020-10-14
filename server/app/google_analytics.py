import requests
from app.mail import send_mail
from common.utils import vars, is_dev
from common.database import session
from sqlalchemy import text
from typing import Union
from pydantic import UUID4
import hashlib

DEBUG = is_dev()
def ga(uid: Union[str, UUID4], category: str, action: str):
    """
    I'm only tracking interesting server-side events right now (no cookies), I want to see what features
    are being used and important bits like sign-ups & book-thumbs. user-id is obfuscated
    https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
    """
    # actually don't care about uid, just need a unique identifier. Note this is
    # a 1-way hash (right?), so I can't even decrypt - just want unique per-feature track
    uid_ = str(uid).encode()  # to bytes
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
    if DEBUG: print(res.json())

    if action in ('register', 'like', 'dislike', 'therapist'):
        with session() as sess:
            if sess.execute(text("""
            select is_superuser su from users where id=:uid
            """), dict(uid=uid)).fetchone().su:
                # don't notify of my own or Lisa's entries
                return
        send_mail('tylerrenelle@gmail.com', 'action', dict(category=category, action=action))
