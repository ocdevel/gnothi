import os, sys, pdb
from datetime import datetime
from sqlalchemy import create_engine
from utils import vars, DROP_SQL
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

if method == 'push':
    now = datetime.now().strftime("%Y-%m-%d-%I-%Mp")
    os.system(f"pg_dump {to_url} > tmp/bk-{now}.sql")
    with to_engine.connect() as conn:
        conn.execute(DROP_SQL)
    # cmd = f"pg_dump --no-owner --no-acl {from_url}"\
    #       f" | sed 's/{from_name}/{to_name}/g'"\
    #       f" | psql {to_url}"
    cmd = f"pg_dump --no-owner --no-acl {from_url}" \
          f" | psql {to_url}"
    os.system(cmd)
    exit(0)

# pull

dfs = []
# fetch old data, we may be pushing live to a new schema
with from_engine.connect() as from_conn:
    for t in 'users fields entries family_types family_issue_types family family_issues'.split():
        sql = f"select * from {t}"
        dfs.append([t, pd.read_sql(t, from_conn)])

    from uuid import uuid4
    df = pd.read_sql(f"""
    select fe.*, e.created_at, e.user_id
    from field_entries fe
    join entries e on e.id=fe.entry_id
    """, from_conn)
    df.drop(columns=['entry_id'], inplace=True)
    df['id'] = [uuid4() for _ in range(df.shape[0])]
    dfs.insert(3, ['field_entries', df])

## Was trying to re-generate local DB from code, but issue. Just start server
## to regen localDB with `WIPE=1 flask run` and go from there
#     # wipe local database
#     from_conn.execute(DROP_SQL)
# # recreate schema
# import jwtauthtest.models
# declarative_base().metadata.create_all(bind=from_engine)

with to_engine.connect() as to_conn:
    for t, df in dfs:
        df.to_sql(t, to_conn, index=False, if_exists='append')

