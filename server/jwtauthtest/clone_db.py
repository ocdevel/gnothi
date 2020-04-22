import os, sys, pdb
from datetime import datetime
from sqlalchemy import create_engine
from utils import vars, DROP_SQL
import pandas as pd

method = sys.argv[-1]  # push/pull/backup
now = datetime.now().strftime("%Y-%m-%d-%I-%Mp")

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

if method == 'push':
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
    tables = """
    users
    fields 
    entries 
    field_entries 
    family_types
    family_issue_types 
    family
    family_issues
    tags
    shares
    shares_tags
    entries_tags
    jobs
    """

    for t in tables.split():
        sql = f"select * from {t}"
        df = pd.read_sql(t, from_conn)
        dfs.append([t, df])

## Was trying to re-generate local DB from code, but issue. Just start server
## to regen localDB with `WIPE=1 flask run` and go from there
#     # wipe local database
#     from_conn.execute(DROP_SQL)
# # recreate schema
# import jwtauthtest.models
# declarative_base().metadata.create_all(bind=from_engine)

from uuid import uuid4
with to_engine.connect() as c:
    for t, df in dfs:
        df.to_sql(t, c, index=False, if_exists='append')


    uids = [x.id for x in c.execute('select id from users').fetchall()]
    main_tags = [
        dict(user_id=uid, name='Main', id=str(uuid4()), main=True)
        for uid in uids
    ]
    pd.DataFrame(main_tags).to_sql('tags', c, index=False, if_exists='append')

    sql = """
    select * from entries
    where entries.id not in (select entry_id from entries_tags)
    """
    entries = c.execute(sql).fetchall()
    main_tags = {t['user_id']: t['id'] for t in main_tags}
    entry_tags = [
        dict(entry_id=e.id, tag_id=main_tags[e.user_id])
        for e in entries
    ]
    pd.DataFrame(entry_tags).to_sql('entries_tags', c, index=False, if_exists='append')




