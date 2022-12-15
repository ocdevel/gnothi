import pytz
from common.database import with_db
from apscheduler.schedulers.blocking import BlockingScheduler
from app import habitica
from common.cloud_updown import cloud_up_maybe
import common.models as M

# FIXME this stuff just needed for db.session in sub methods. Move off this and pass sess around instead
from fastapi import FastAPI
app = FastAPI()


def run_influencers(db):
    M.Job.create_job(db, user_id=None, method='influencers')


def run_job(fn):
    with with_db() as db:
        fn(db)

try:
    scheduler = BlockingScheduler(timezone=pytz.timezone('America/Los_Angeles'))
    for fn, timing in [
        [habitica.cron, dict(hour="*")],
        [run_influencers, dict(hour="*")],
    ]:
        scheduler.add_job(run_job, args=[fn], trigger="cron", **timing)
    scheduler.start()
except (KeyboardInterrupt, SystemExit):
    pass
