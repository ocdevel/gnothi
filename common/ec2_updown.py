import boto3, time, threading, os, socket
from common.utils import is_dev, vars, utcnow
from sqlalchemy import text
from fastapi_sqlalchemy import db
import logging
logger = logging.getLogger(__name__)

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')
svc = vars.MACHINE or socket.gethostname()
PCs = ['desktop', 'laptop']


def _fetch_status(sess):
    return sess.execute(f"""
    select status, svc,
        extract(epoch FROM ({utcnow} - ts_svc)) as elapsed_svc,
        extract(epoch FROM ({utcnow} - ts_client)) as elapsed_client
    from jobs_status;
    """).fetchone()


def ec2_up():
    if is_dev(): return
    logger.warning("Turning on EC2")
    try:
        ec2_client.start_instances(InstanceIds=[vars.GPU_INSTANCE])
    except: pass


def jobs_status():
    # db.session available in ContextVars from fastapi_sqlalchemy
    res = _fetch_status(db.session)
    # debounce client (race-condition, perf)
    # TODO maybe cache it as global var, so not hitting db so much?
    if res.elapsed_client < 3:
        return res.status
    db.session.execute(f"update jobs_status set ts_client={utcnow}")
    db.session.commit()

    # job service is fresh (5s)
    if res.elapsed_svc < 5: pass
    # desktop was recently active; very likely  will be back soon
    elif res.elapsed_svc < 300 and res.svc in [PCs]: pass
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
    logger.warning("Shutting down EC2")
    try:
        ec2_client.stop_instances(InstanceIds=[vars.GPU_INSTANCE])
    except: pass


def notify_online(sess):
    # get status.svc before notifying online
    status = _fetch_status(sess)
    # notify online
    sess.execute(text(f"""
    update jobs_status set status='on', ts_svc={utcnow}, svc=:svc
    """), dict(svc=svc))
    sess.commit()

    any_working = sess.execute("""
    select 1 from jobs where state in ('working', 'new') limit 1
    """).fetchone()

    # Desktop's taking over, take a rest EC2
    if (svc in PCs) and (status.svc not in PCs) and (not any_working):
        threading.Thread(target=ec2_down).start()
        return status

    # client/gpu still active (5 min), or server already off (?)
    # Note the client setInterval will keep the activity fresh using even if idling, so no need to wait long after
    if status.elapsed_client / 60 < 5 \
        or status.status == 'off' \
        or any_working:
        return status

    # Client inactive, no jobs working. Off you go.
    sess.execute(f"update jobs_status set status='off', ts_client={utcnow}")
    ec2_down()
