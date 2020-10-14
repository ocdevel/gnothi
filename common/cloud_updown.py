import time, threading, os, socket, pdb
from common.utils import is_dev, vars, utcnow
from common.database import session
import common.models as M
from sqlalchemy import text
from fastapi_sqlalchemy import db
from gradient import JobsClient
import logging
logger = logging.getLogger(__name__)

job_client = JobsClient(api_key=vars.PAPERSPACE_API_KEY)

up_states = """
Pending
Building
Provisioning
Provisioned
Network Setup
Starting
Stopping
Running
Created
Network Setting Up
Aborting
Network Teardown
Network Tearing Down
""".split()

down_states = """
Stopped
Error
Failed
Cancelled
""".split()


def list_states():
    jobs = job_client.list()
    print(list(set([j.state for j in jobs.list()])))


def cloud_up_maybe():
    if is_dev(): return
    with session() as sess:
        if M.User.last_checkin(sess) > 10: return
        if M.Machine.gpu_status(sess) != "off": return

        logger.warning("Initing Paperspace")
        M.Machine.notify_online(sess, 'paperspace', 'pending')
        jobs = job_client.list()
        if any([j.state in up_states for j in jobs]):
            return

        vars_ = {**dict(vars), **{'MACHINE': 'paperspace'}}
        return job_client.create(
            machine_type='K80',
            container='lefnire/gnothi:gpu-0.0.40',
            project_id=vars.PAPERSPACE_PROJECT_ID,
            is_preemptible=True,
            command='python app/run.py',
            env_vars=vars_
        )


def cloud_down_maybe(sess):
    if is_dev(): return

    # 15 minutes since last job
    active = M.Job.last_job(sess) < 15
    if active or vars.MACHINE in ['desktop', 'laptop']:
        return

    sess.query(M.Machine).filter_by(id=vars.MACHINE).delete()
    sess.commit()
    exit(0)
    # jobs = job_client.list()
    # for j in jobs:
    #     if j.state in up_states:
    #         logger.warning("Stopping Paperspace")
    #         job_client.delete(job_id=j.id)
