import os, sys, pdb
from sqlalchemy import create_engine
from utils import vars
import pandas as pd

method = sys.argv[-1]  # push/pull

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

drop_sql = "DROP SCHEMA public CASCADE;CREATE SCHEMA public;"
dfs = []
if method == 'push':
    # fetch old data, we may be pushing live to a new schema
    with to_engine.connect() as to_conn, from_engine.connect() as from_conn:
        for t in 'users fields entries field_entries family_types family_issue_types'.split():
            dfs.append([t, pd.read_sql(t, to_conn)])

    ## Was trying to re-generate local DB from code, but issue. Just start server
    ## to regen localDB with `WIPE=1 flask run` and go from there
    #     # wipe local database
    #     from_conn.execute(drop_sql)
    # # recreate schema
    # import jwtauthtest.models
    # declarative_base().metadata.create_all(bind=from_engine)

with to_engine.connect() as conn:
    conn.execute(drop_sql)

# cmd = f"pg_dump --no-owner --no-acl {from_url}"\
#       f" | sed 's/{from_name}/{to_name}/g'"\
#       f" | psql {to_url}"
cmd = f"pg_dump --no-owner --no-acl {from_url}"\
      f" | psql {to_url}"
os.system(cmd)

with to_engine.connect() as conn:
    for t, df in dfs:
        df.to_sql(t, conn, index=False, if_exists='append')

