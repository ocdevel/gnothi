import os
from box import Box
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from common.utils import vars, utcnow
# just for fastapi-users (I'm using sqlalchemy+engine+session everywhere else)
import databases
import logging
logger = logging.getLogger(__name__)

Base = declarative_base()

engine = create_engine(
    vars.DB_URL,
    # TODO getting timout errors, trying some solutions
    # https://stackoverflow.com/a/60614871/362790
    # https://docs.sqlalchemy.org/en/13/core/pooling.html#dealing-with-disconnects
    # https://medium.com/@heyjcmc/controlling-the-flask-sqlalchemy-engine-a0f8fae15b47
    pool_pre_ping=True,
    pool_recycle=300,
)
engine_books = create_engine(
    vars.DB_BOOKS,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessLocal = Box(
    main=scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine)),
    books=scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine_books))
)

fa_users_db = databases.Database(vars.DB_URL)


def init_db():
    # add `import app.models` in calling code beforehand (after `import database`)
    Base.metadata.create_all(bind=engine)
    # e6dfbbd8: kick off create_all with sess.execute()
    # 2-birds: init lazy connection; ensure jobs_status
    engine.execute(f"""
    insert into jobs_status (id, status, ts_client, ts_svc, svc)
    values (1, 'off', {utcnow}, {utcnow}, null)
    on conflict (id) do nothing;
    """)


def shutdown_db():
    for _, sess in SessLocal.items():
        sess.remove()
