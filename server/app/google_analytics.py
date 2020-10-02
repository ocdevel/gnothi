import requests
from common.utils import vars, is_dev
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
    uid = str(uid).encode()  # to bytes
    uid = hashlib.sha256(uid).hexdigest()
    url = "https://ssl.google-analytics.com/"
    url += "debug/collect" if DEBUG else "collect"
    res = requests.post(url, params=dict(
        v=1,
        tid=vars.GA,
        cid=uid,
        t='event',
        ec=category,
        ea=action
    ))
    if DEBUG: print(res.json())
