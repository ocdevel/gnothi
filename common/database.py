import os
from box import Box
from functools import lru_cache
from typing import Iterator
from fastapi_utils.session import FastAPISessionMaker
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker, Session
from common.utils import vars
# just for fastapi-users (I'm using sqlalchemy+engine+session everywhere else)
import databases
import logging
from contextlib import contextmanager
logger = logging.getLogger(__name__)

Base = declarative_base()


def get_db() -> Iterator[Session]:
    """ FastAPI dependency that provides a sqlalchemy session """
    yield from _get_fastapi_sessionmaker().get_db()


@lru_cache()
def _get_fastapi_sessionmaker() -> FastAPISessionMaker:
    """ This function could be replaced with a global variable if preferred """
    return FastAPISessionMaker(vars.DB_FULL)


with_db = FastAPISessionMaker(vars.DB_FULL).context_session


def init_db():
    engine.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    # add `import app.models` in calling code beforehand (after `import database`)
    Base.metadata.create_all(bind=engine)
    # e6dfbbd8: kick off create_all with sess.execute()
    engine.execute("select 1")


def shutdown_db():
    # using context-vars session-makers now
    pass

###
# TODO phase out then delete the below code, have moved to sqlalchemy-utils
###


engine = create_engine(
    vars.DB_FULL,
    # TODO getting timout errors, trying some solutions
    # update 2020-10-03: I added these many months ago, before I switch to contextmanager(session). Are these needed
    # anymore, or was that the fix?
    # https://stackoverflow.com/a/60614871/362790
    # https://docs.sqlalchemy.org/en/13/core/pooling.html#dealing-with-disconnects
    # https://medium.com/@heyjcmc/controlling-the-flask-sqlalchemy-engine-a0f8fae15b47
    pool_pre_ping=True,
    pool_recycle=300,
)
print(engine)

Sessions = dict(
    main=sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

try:
    engine_books = create_engine(
        vars.DB_BOOKS,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    # autocommit/flush not needed; never saving to this db anyway
    Sessions['books'] = sessionmaker(bind=engine_books)
except:
    # engine_books only needed for Libgen. When you start developing, you won't need this until working on books.
    # Libgen is very large and a process to setup, so for now just ignore if it's not present, and you'll get the
    # error downstream if working on books.
    logger.warning("Couldn't connect to DB_BOOKS, download Libgen & import to MySQL. Only needed for books development.")
    pass


@contextmanager
def session(k='main', commit=True):
    sess = Sessions[k]()
    try:
        yield sess
        if commit:
            sess.commit()
    except:
        sess.rollback()
        raise
    finally:
        sess.close()


fa_users_db = databases.Database(vars.DB_FULL)
