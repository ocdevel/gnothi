import pdb, pytz
from app.app_app import app as app_
import app.app_jwt
import app.app_routes
from common.utils import is_dev
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app import habitica
from app.ec2_updown import ec2_down_maybe

app = app_  # module issue


@app.on_event('startup')
async def startup_event():
    scheduler = AsyncIOScheduler(timezone=pytz.timezone('America/Los_Angeles'))
    scheduler.start()
    scheduler.add_job(habitica.cron, "cron", hour="*")
    scheduler.add_job(ec2_down_maybe, "cron", minute="*")


if __name__ == "__main__":
    args_ = {'debug': True} if is_dev() else {'port': 80}
    app.run(host='0.0.0.0', **args_)
