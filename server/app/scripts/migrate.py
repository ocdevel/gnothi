from common.database import init_db, shutdown_db, SessLocal
import common.models as M
from common.utils import utcnow

def migrate_before(engine):
    pass

def migrate_after(engine):
    engine.execute(f"""
    update users set is_cool=false where is_cool is null;
    
    update bookshelf set created_at={utcnow} where created_at is null;
    update bookshelf set updated_at={utcnow} where updated_at is null;

    update books set thumbs=0 where thumbs is null;
    
    update entries set created_at={utcnow} where created_at is null;
    update entries set updated_at={utcnow} where updated_at is null;
    
    update fields set created_at={utcnow} where created_at is null;
    update fields set default_value='value' where default_value is null;
    update fields set target=false where target is null;
    
    update tags set main=false where main is null;
    update tags set created_at={utcnow};
    """)

