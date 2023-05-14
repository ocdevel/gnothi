import os, sys
from sqlalchemy import create_engine
from utils import vars
import pandas as pd

run = sys.argv[-1] == 'run'

with create_engine(vars.DB_PROD_FULL).connect() as conn:
    df = pd.read_sql('select * from field_entries order by created_at desc', conn)
    clean = df.drop_duplicates(['field_id', 'created_at'])
    if df.shape[0] == clean.shape[0]:
        print('No dupes')
        exit(0)

    print('main', df.shape[0])
    print('duplicates', df.shape[0] - clean.shape[0])
    print('dupe vals too', df.shape[0] - df.drop_duplicates(['field_id', 'created_at', 'value']).shape[0])

    if not run: exit(0)
    conn.execute('delete from field_entries')
    clean.to_sql('field_entries', conn, index=False, if_exists='append')
