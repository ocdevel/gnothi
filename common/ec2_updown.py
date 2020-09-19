import time, threading, os, socket, pdb
from common.utils import is_dev, vars, utcnow
from sqlalchemy import text
from fastapi_sqlalchemy import db
from gradient import JobsClient
import logging
logger = logging.getLogger(__name__)

svc = vars.MACHINE or socket.gethostname()
PCs = ['desktop', 'laptop']

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

def _fetch_status(sess, gpu=False):
    status = sess.execute(f"""
    select status, svc,
        extract(epoch FROM ({utcnow} - ts_svc)) as elapsed_svc,
        extract(epoch FROM ({utcnow} - ts_client)) as elapsed_client
    from jobs_status
    """).fetchone()
    if not status:
        svc_ = svc if gpu else None
        stat = 'on' if gpu else 'off'
        sess.execute(text(f"""
        insert into jobs_status (id, status, ts_svc, ts_client, svc) 
        values (1, :stat, {utcnow}, {utcnow}, :svc)
        """), dict(svc=svc_, stat=stat))
        sess.commit()
        return _fetch_status(sess, gpu)
    return status


def ec2_up():
    if is_dev(): return
    logger.warning("Initing Paperspace")
    jobs = job_client.list()
    if any([j.state in up_states for j in jobs]):
        return

    # TODO more carefully decide what to send, security
    vars_ = {
        **dict(vars),
        **dict(
            MACHINE='paperspace',
            ENVIRONMENT='production'
        )
    }

    import json
    res = job_client.create(
        machine_type='K80',
        container='lefnire/gnothi:gpu-0.0.7',
        project_id=vars.PAPERSPACE_PROJECT_ID,
        is_preemptible=True,
        command='python run.py',
        registry_username=vars.PAPERSPACE_REGISTRY_USERNAME,
        registry_password=vars.PAPERSPACE_REGISTRY_PASSWORD,
        job_env=vars_
    )
    for j in job_client.list():
        print(j.state, j.working_directory)
    return res


def jobs_status():
    # db.session available in ContextVars from fastapi_sqlalchemy
    res = _fetch_status(db.session, gpu=False)
    # debounce client (race-condition, perf)
    # TODO maybe cache it as global var, so not hitting db so much?
    if res.elapsed_client < 3:
        return res.status
    db.session.execute(f"update jobs_status set ts_client={utcnow}")
    db.session.commit()

    # job service is fresh (5s)
    if res.elapsed_svc < 5: pass
    # desktop was recently active; very likely  will be back soon
    elif res.elapsed_svc < 300 and res.svc in PCs: pass
    # jobs svc stale (pending|off), decide if should turn ec2 on
    else:
        # status=on if server not turned off via ec2_down_maybe
        db.session.execute("update jobs_status set status='pending'")
        db.session.commit()
        if res.status in ['off', 'on']:
            threading.Thread(target=ec2_up).start()
    return res.status


def ec2_down():
    if is_dev(): return
    logger.warning("Stopping Paperspace")
    jobs = job_client.list()
    for j in jobs:
        print(j.state)
        if j.state in up_states:
            job_client.delete(job_id=j.id)


def notify_online(sess):
    # get status.svc before notifying online
    status = _fetch_status(sess, gpu=True)
    sess.execute(text(f"""
    -- notify online
    update jobs_status set status='on', ts_svc={utcnow}, svc=:svc;
    -- remove stale jobs
    delete from jobs 
    where created_at < {utcnow} - interval '20 minutes' and state in ('working', 'done');
    """), dict(svc=svc))
    sess.commit()

    any_working = sess.execute("""
    select 1 from jobs where state in ('working', 'new') limit 1
    """).fetchone()

    # Desktop's taking over, take a rest EC2
    if (svc in PCs) and (status.svc not in PCs) and (not any_working):
        threading.Thread(target=ec2_down).start()

    # client/gpu still active (5 min)
    # Note the client setInterval will keep the activity fresh using even if idling, so no need to wait long after
    elif status.elapsed_client / 60 < 5 or any_working:
        pass

    # Client inactive, no jobs working. Off you go.
    else:
        sess.execute(f"update jobs_status set status='off', ts_client={utcnow}")
        sess.commit()
        threading.Thread(target=ec2_down).start()

    return status
