from sqlalchemy import create_engine
from app.utils import vars
engine = create_engine(vars.DB_URL)


engine.execute("""
alter table users rename column username to email;
alter table users rename column password to hashed_password;
alter table users add is_active bool;
alter table users add is_superuser bool;
update users set is_active=true where true;
""")
