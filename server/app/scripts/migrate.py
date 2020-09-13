from common.database import init_db, shutdown_db, SessLocal
import common.models as M
from common.utils import utcnow

def migrate_before(engine):
    pass

def migrate_after(engine):
    engine.execute("update users set is_cool=false")

