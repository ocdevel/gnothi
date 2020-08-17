import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
from server.utils import vars, DROP_SQL

engine = create_engine(
    vars.DB_URL,
    convert_unicode=True,
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

db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()


def init_db():
    import server.models
    Base.metadata.create_all(bind=engine)
    # since connections are lazy, kick it off.
    engine.execute("select 1")


def shutdown_db_session():
    db_session.remove()
