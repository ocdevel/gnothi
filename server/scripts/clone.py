import os, sys, pdb
from datetime import datetime
from sqlalchemy import create_engine
from common.utils import vars, DROP_SQL
from common.database import init_db, shutdown_db
from sqlalchemy_utils.functions import drop_database, create_database, database_exists
from scripts.migrate import migrate_before, migrate_after
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("method", help="backup|pull|push|wipe")
parser.add_argument("--migrate", action='store_true', help="Run a migration")
args = parser.parse_args()

method = args.method
now = datetime.utcnow().strftime("%Y-%m-%d-%I-%Mp")

engines_ = {}
def engine(url):
    engines_[url] = engines_.get(url, create_engine(url))
    return engines_[url]



def wipe(url, and_init=False):
    engine(url).execute(DROP_SQL)
    if and_init:
        import common.models  # sets up Base.metadata
        init_db()
        shutdown_db()

def backup():
    os.system(f"pg_dump {vars.DB_PROD_URL} > tmp/bk-{now}.sql")


if method == 'push':
    if input("Push to prod, are you sure [yn]?") != 'y': exit(0)
    backup()

if method == 'backup':
    backup()
    exit(0)

if method == 'wipe':
    wipe(vars.DB_URL, True)
    exit(0)

if method == 'push':
    from_url, from_name = vars.DB_URL, vars.DB_NAME
    to_url, to_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
elif method in ['pull', 'migrate']:
    from_url, from_name = vars.DB_PROD_URL, vars.DB_PROD_NAME
    to_url, to_name = vars.DB_URL, vars.DB_NAME
else:
    raise Exception("Unrecognized args.method")

print('from', from_url)
print('to', to_url)


# cmd = f"pg_dump --no-owner --no-acl {from_url}"\
#       f" | sed 's/{from_name}/{to_name}/g'"\
#       f" | psql {to_url}"
cmd = f"pg_dump --no-owner --no-acl"

if args.migrate:
    if method == 'push':
        raise NotImplemented("push --migrate not yet supported")
    tmp_url = to_url.replace('dev', 'tmp')
    if database_exists(tmp_url):
        drop_database(tmp_url)
    create_database(tmp_url)
    os.system(f"{cmd} {from_url} | psql {tmp_url}")
    migrate_before(engine(tmp_url))
    wipe(to_url, and_init=True)
    os.system(f"{cmd} {tmp_url} --data-only | psql {to_url}")
    migrate_after(engine(to_url))
else:
    wipe(to_url, and_init=False)
    os.system(f"{cmd} {from_url} | psql {to_url}")
