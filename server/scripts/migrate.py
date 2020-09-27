from common.database import init_db
import common.models as M
from common.utils import utcnow
from sqlalchemy import text

def migrate_before(engine):
    pass

def migrate_after(engine):
    pass
    # This isn't working? just will run manually
    # engine.execute("""
    # with avgs as (
    #     select field_id, avg(value) as value
    #     from field_entries group by field_id
    # )
    # update fields f set avg=a.value
    # from avgs a where a.field_id=f.id;
    # """)
