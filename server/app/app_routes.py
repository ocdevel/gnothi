import pdb, re, datetime, logging, boto3, io
import shortuuid
import dateutil.parser
from typing import List, Dict, Any
from fastapi import Depends, HTTPException, File, UploadFile, BackgroundTasks, WebSocket
from app.app_app import app
from app.routes.users import users_router
from app.routes.stripe import stripe_router
from app.routes.groups import groups_router
from app.routes.auth import auth_router
from fastapi_sqlalchemy import db  # an object to provide global access to a database session
import sqlalchemy as sa
from sqlalchemy import text
import common.models as M
from common.utils import SECRET
from app import habitica
from urllib.parse import quote as urlencode
from app.google_analytics import ga
import pandas as pd
from fastapi.responses import StreamingResponse
from app.utils.http import cant_snoop, send_error, getuser

logger = logging.getLogger(__name__)

app.include_router(stripe_router, prefix='/stripe')


@app.get('/health')
def health_get():
    return {'ok': True}


@app.get('/stats')
def stats_get():
    exec = db.session.execute
    users = exec("select count(*) ct from users").fetchone().ct
    therapists = exec("select count(*) ct from users where therapist=true").fetchone().ct
    books = exec("""
    select s.shelf
    from books b
    inner join bookshelf s on b.id=s.book_id
    inner join users u on u.id=s.user_id
    where s.shelf not in ('ai', 'cosine')
        and u.is_superuser is not true
        and b.amazon is null
    order by s.created_at desc;
    """).fetchall()
    return dict(
        users=users,
        therapists=therapists,
        upvotes=sum([1 for b in books if b.shelf in ('like', 'already_read', 'recommend')]),
        downvotes=sum([1 for b in books if b.shelf in ('dislike', 'remove')]),
    )
