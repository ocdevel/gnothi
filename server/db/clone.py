import os, sys, pdb
from datetime import datetime
from sqlalchemy import create_engine
from server.utils import vars, DROP_SQL
import pandas as pd
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("method", help="backup|pull|push")
# parser.add_argument("--by", help="only applicable for pull, how to do pull (wipe|pandas|?)")
args = parser.parse_args()

method = args.method
now = datetime.now().strftime("%Y-%m-%d-%I-%Mp")

if method == 'push' and input("Push to prod, are you sure [yn]?") != 'y':
    exit(0)

if method == 'backup':
    os.system(f"pg_dump {vars.DB_PROD_URL} > tmp/bk-{now}.sql")
    exit(0)

if method == 'push':
    from_url, from_name = vars.DB_URL, vars.DB_NAME
    to_url, to_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
elif method == 'pull':
    from_url, from_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
    to_url, to_name = vars.DB_URL, vars.DB_NAME
else:
    raise("2nd arg must be push or pull")

print('from', from_url)
from_engine = create_engine(from_url)
print('to', to_url)
to_engine = create_engine(to_url)

# backup prod, just in case
os.system(f"pg_dump {vars.DB_PROD_URL} > tmp/bk-{now}.sql")
to_engine.execute(DROP_SQL)
# cmd = f"pg_dump --no-owner --no-acl {from_url}"\
#       f" | sed 's/{from_name}/{to_name}/g'"\
#       f" | psql {to_url}"
cmd = f"pg_dump --no-owner --no-acl {from_url}" \
      f" | psql {to_url}"
os.system(cmd)
exit(0)

if method == 'pull':
    with to_engine.connect() as conn:
        conn.execute(DROP_SQL)
    # cmd = f"pg_dump --no-owner --no-acl {from_url}"\
    #       f" | sed 's/{from_name}/{to_name}/g'"\
    #       f" | psql {to_url}"
    cmd = f"pg_dump --no-owner --no-acl {from_url}" \
          f" | psql {to_url}"
    os.system(cmd)
    exit(0)

# 0c942cbb: pandas-style pull (for certain migrations? can't remember)