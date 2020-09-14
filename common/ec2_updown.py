import boto3, time, threading, os
from common.utils import is_dev, vars, utcnow
from common.database import session
from fastapi_sqlalchemy import db

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')


def _fetch_status(sess):
    return sess.execute(f"""
    select status, svc,
        extract(epoch FROM ({utcnow} - ts_svc)) as elapsed_svc,
        extract(epoch FROM ({utcnow} - ts_client)) as elapsed_client
    from jobs_status;
    """).fetchone()


def ec2_up():
    if is_dev(): return
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
    elif res.elapsed_svc < 300 and res.svc == 'DESKTOP-RD4B4G9': pass
    # jobs svc stale (pending|off), decide if should turn ec2 on
    else:
        # status=on if server not turned off via ec2_down_maybe
        db.session.execute("update jobs_status set status='pending'")
        db.session.commit()
        if res.status in ['off', 'on']:
            threading.Thread(target=ec2_up).start()
    return res.status


def ec2_down_maybe():
    # running on gpu instance, so fastapi_sqlalchemy.db not available here
    with session() as sess:
        res = _fetch_status(sess)
        # turn off after 5 minutes of inactivity. Note the client setInterval will keep the activity fresh while
        # using even if idling, so no need to wait long after
        if res.elapsed_client / 60 < 5 or res.status == 'off':
            return
        # still have jobs to complete
        if sess.execute("""
        select id from jobs where state in ('working', 'new') limit 1
        """).fetchone():
            return
        sess.execute(f"update jobs_status set status='off', ts_client={utcnow}")
    if is_dev(): return
    try:
        # Try to turn off from anywhere. If desktop sees this, all the better: "I'm taking over"
        ec2_client.stop_instances(InstanceIds=[vars.GPU_INSTANCE])
    except: pass
