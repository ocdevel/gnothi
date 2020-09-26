from common.database import init_db
import common.models as M
from common.utils import utcnow

def migrate_before(engine):
    pass

def migrate_after(engine):
    engine.execute("""
    update shares_tags set selected=true;
    update tags set selected=main;
    """)

