from common.database import init_db
import common.models as M
from common.utils import utcnow

def migrate_before(engine):
    engine.execute("""
    alter table cache_users drop column last_influencers; 
    alter table cache_users drop column influencers; 
    alter table cache_users drop column last_books; 
    alter table fields drop column target; 
    """)

def migrate_after(engine):
    engine.execute("""
    update fields set influencer_score=0, next_pred=0;
    update users set ai_ran=false, last_influencers=null, last_books=null, therapist=false;
    """)

