import os, sys, pdb
from datetime import datetime
from sqlalchemy import create_engine
from app.utils import vars, DROP_SQL
from app.database import init_db, shutdown_db
import pandas as pd
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("method", help="backup|pull|push|wipe")
parser.add_argument("--data-only", action="store_true", help="if running a migration, set this so local creates the schema and we copy in prod data")
args = parser.parse_args()

method = args.method
now = datetime.now().strftime("%Y-%m-%d-%I-%Mp")

if method == 'push' and input("Push to prod, are you sure [yn]?") != 'y':
    exit(0)

if method == 'backup':
    os.system(f"pg_dump {vars.DB_PROD_URL} > tmp/bk-{now}.sql")
    exit(0)

if method == 'wipe':
    create_engine(vars.DB_URL).execute(DROP_SQL)
    exit(0)

if method == 'push':
    from_url, from_name = vars.DB_URL, vars.DB_NAME
    to_url, to_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
elif method == 'pull':
    from_url, from_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
    to_url, to_name = vars.DB_URL, vars.DB_NAME
else:
    raise("2nd arg must backup|pull|push|wipe")

print('from', from_url)
print('to', to_url)

# backup prod, just in case
os.system(f"pg_dump {vars.DB_PROD_URL} > tmp/bk-{now}.sql")
create_engine(to_url).execute(DROP_SQL)
if args.data_only:
    init_db()
    shutdown_db()
# cmd = f"pg_dump --no-owner --no-acl {from_url}"\
#       f" | sed 's/{from_name}/{to_name}/g'"\
#       f" | psql {to_url}"
cmd = f"pg_dump --no-owner --no-acl"
if args.data_only: cmd += " --data-only"
cmd += f" {from_url} | psql {to_url}"
os.system(cmd)

# 0c942cbb: pandas-style pull (for certain migrations? can't remember)
