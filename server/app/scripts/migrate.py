from sqlalchemy import create_engine


def migrate(db_url):
    sql = "update shares set last_seen='2020-08-24', new_entries=0"
    create_engine(db_url).execute(sql)
