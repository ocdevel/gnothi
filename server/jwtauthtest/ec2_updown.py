import boto3, time, threading
from jwtauthtest.database import engine

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')
EC2_ID = 'i-03e8ad4f3cadd4a4e'


def _fetch_status():
    sql = """
    SELECT status, 
        EXTRACT(SECOND FROM (now() - ts)) as elapsed_sec
    FROM jobs_status
    """
    return engine.execute(sql).fetchone()

def ec2_up_maybe():
    engine.execute("update jobs_status set status='off', ts=now()")
    time.sleep(5)
    res = _fetch_status()
    if res.status == 'on': return
    # currently ignores failure (try/catch); TODO check status (pending, shutting-down, etc) for yellow-indicator,
    # remove try/catch
    try:
        ec2_client.start_instances(InstanceIds=[EC2_ID])
    except: pass


def jobs_status():
    res = _fetch_status()
    if res.elapsed_sec > 5:
        x = threading.Thread(target=ec2_up_maybe, daemon=True)
        x.start()
    return res.status

# already threaded since in cron job
def ec2_down_maybe():
    res = _fetch_status()
    if res.elapsed_sec / 60 < 30:
        return
    engine.execute("update jobs_status set status='off', ts=now()")
    try:
        ec2_client.stop_instances(InstanceIds=[EC2_ID])
    except: pass