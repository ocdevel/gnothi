import os, sys, pdb
from sqlalchemy import create_engine
from app.utils import vars
from app.models import User, Entry, Field, Person, Share, Tag
from sqlalchemy_utils.types.encrypted.encrypted_type import StringEncryptedType, FernetEngine
engine = create_engine(vars.DB_URL)


for M in [User, Entry, Field, Person, Share, Tag]:
    t = M.__table__
    rows = engine.execute(f"select * from {t.name}").fetchall()
    for r in rows:
        sql = {}
        for c in t.columns:
            if type(c.type) != StringEncryptedType: continue
            v = c.type.process_bind_param(getattr(r, c.name), "postgresql")
            if v: sql[c.name] = v
        if not sql: continue
        engine.execute(f"""
        update {t.name} 
        set {', '.join(f"{k}='{v}'" for k, v in sql.items())}
        where id='{r.id}'
        """)
