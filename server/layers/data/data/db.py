import os

from utils.settings import settings, logger
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker, Session
from contextlib import contextmanager

DROP_SQL = 'DROP SCHEMA public CASCADE;CREATE SCHEMA public;'

cluster_arn = os.environ['cluster_arn']
secret_arn = os.environ['secret_arn']

engine = create_engine('postgresql+auroradataapi://:@/gnothi_dev',
                       echo=True,
                       connect_args=dict(aurora_cluster_arn=cluster_arn, secret_arn=secret_arn))

with engine.connect() as conn:
    for result in conn.execute("select * from pg_catalog.pg_tables"):
        print(result)

engine.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
Base = declarative_base()
Base.metadata.create_all(bind=engine)

# try:
#     engine_books = create_engine(
#         vars.DB_BOOKS,
#         pool_pre_ping=True,
#         pool_recycle=300,
#     )
#     # autocommit/flush not needed; never saving to this db anyway
#     Sessions['books'] = sessionmaker(bind=engine_books)
# except:
#     # engine_books only needed for Libgen. When you start developing, you won't need this until working on books.
#     # Libgen is very large and a process to setup, so for now just ignore if it's not present, and you'll get the
#     # error downstream if working on books.
#     logger.warning("Couldn't connect to DB_BOOKS, download Libgen & import to MySQL. Only needed for books development.")
#     pass


@contextmanager
def with_session(k='main', commit=True):
    with Session(engine) as sess:
        try:
            yield sess
            if commit:
                sess.commit()
        except:
            sess.rollback()
            raise
        finally:
            sess.close()
