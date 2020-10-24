import pytz
from app.ml import run_influencers
from apscheduler.schedulers.blocking import BlockingScheduler
from app import habitica
from common.cloud_updown import cloud_up_maybe
import common.models as M

# FIXME this stuff just needed for db.session in sub methods. Move off this and pass sess around instead
from fastapi import FastAPI
from fastapi_sqlalchemy import DBSessionMiddleware
from common.utils import vars
app = FastAPI()
app.add_middleware(DBSessionMiddleware, db_url=vars.DB_FULL)

try:
    scheduler = BlockingScheduler(timezone=pytz.timezone('America/Los_Angeles'))
    scheduler.add_job(habitica.cron, "cron", hour="*")
    scheduler.add_job(run_influencers, "cron", hour="*")
    scheduler.add_job(cloud_up_maybe, "cron", second="*/5")
    scheduler.add_job(M.Machine.prune, "cron", minute="*")
    scheduler.add_job(M.Job.prune, "cron", minute="*")
    scheduler.start()
except (KeyboardInterrupt, SystemExit):
    pass
