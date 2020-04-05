import os, sys
from sqlalchemy import create_engine
from utils import vars

method = sys.argv[-1]  # push/pull

if method == 'push':
    from_url, from_name = vars.DB_URL, vars.DB_NAME
    to_url, to_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
elif method == 'pull':
    from_url, from_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
    to_url, to_name = vars.DB_URL, vars.DB_NAME
else:
    raise("2nd arg must be push or pull")

print('from=', from_url, 'to=', to_url)

with create_engine(to_url).connect() as conn:
    conn.execute("""
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    """)

# cmd = f"pg_dump --no-owner --no-acl {from_url}"\
#       f" | sed 's/{from_name}/{to_name}/g'"\
#       f" | psql {to_url}"

cmd = f"pg_dump --no-owner --no-acl {from_url}"\
      f" | psql {to_url}"
os.system(cmd)

