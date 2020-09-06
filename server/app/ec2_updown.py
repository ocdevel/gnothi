import boto3, time, threading, os
from common.utils import is_dev, vars, utcnow
from fastapi_sqlalchemy import db
import socket

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')


def _fetch_status():
    sql = f"""
    -- Ensure 1 row exists
    insert into jobs_status (id, status, ts_client, ts_svc, svc) 
        values (1, 'off', {utcnow}, {utcnow}, null) 
        on conflict (id) do nothing;
    select status, svc,
        extract(epoch FROM ({utcnow} - ts_svc)) as elapsed_svc,
        extract(epoch FROM ({utcnow} - ts_client)) as elapsed_client
    from jobs_status;
    """
    res = db.session.execute(sql)
    db.session.commit()
    return res.fetchone()


def ec2_up():
    if is_dev(): return
    try:
        ec2_client.start_instances(InstanceIds=[vars.GPU_INSTANCE])
    except: pass


def jobs_status():
    res = _fetch_status()
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


# already threaded since in cron job
def ec2_down_maybe():
    with db():
        res = _fetch_status()
        # turn off after 5 minutes of inactivity. Note the client setInterval will keep the activity fresh while
        # using even if idling, so no need to wait long after
        if res.elapsed_client / 60 < 5 or res.status == 'off':
            return
        db.session.execute(f"update jobs_status set status='off', ts_client={utcnow}")
        db.session.commit()
        if is_dev(): return
        try:
            ec2_client.stop_instances(InstanceIds=[vars.GPU_INSTANCE])
        except: pass
