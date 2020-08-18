import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from app.utils import vars

engine = create_engine(
    vars.DB_URL,
    convert_unicode=True,
    pool_size=20,
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

db = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
dbx = scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine))
db_books = scoped_session(sessionmaker(autocommit=True, autoflush=True, bind=engine_books))

Base = declarative_base()
Base.query = db.query_property()


def init_db():
    import app.models
    Base.metadata.create_all(bind=engine)
    # since connections are lazy, kick it off.
    dbx.execute("select 1")


def shutdown_db():
    db.remove()
    dbx.remove()
    db_books.remove()
