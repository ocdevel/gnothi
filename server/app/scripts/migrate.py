from sqlalchemy import create_engine


def migrate(db_url):
    engine = create_engine(db_url)
    engine.execute("""
    alter table users rename column username to email;
    alter table users rename column password to hashed_password;
    alter table users add is_active bool default true;
    alter table users add is_superuser bool default false;
    update users set is_active=true, is_superuser=false where true;
    """)
