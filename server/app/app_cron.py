from app.app_app import app
from app import habitica
from app.ec2_updown import ec2_down_maybe

# https://github.com/viniciuschiele/flask-apscheduler/blob/master/examples/jobs.py
from flask_apscheduler import APScheduler
class Config(object):
    SCHEDULER_API_ENABLED = True
scheduler = APScheduler()


@scheduler.task('cron', id='do_job_habitica', hour="*", misfire_grace_time=900)
def job_habitica():
    habitica.cron()


@scheduler.task('cron', id='do_job_ec2', minute="*", misfire_grace_time=900)
def job_ec2():
    ec2_down_maybe()


app.config.from_object(Config())
scheduler.init_app(app)
scheduler.start()
