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
    send_mail('tylerrenelle@gmail.com', 'action', dict(category=category, action=action))
