import boto3
import threading

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')
# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/batch.html
batch_client = boto3.client('batch')

EC2_ID = 'i-03e8ad4f3cadd4a4e'
JQ = 'gnothi-jq'
JD = 'gnothi-jd'
VALID_STATES = 'SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING'.split(',')


def _ec2_up():
    try:
        ec2_client.start_instances(InstanceIds=[EC2_ID])
    except: pass


def _batch_up():
    # TODO can I use status as single string in list_jobs (rather than 5 calls here?)
    any_ = False
    for status in VALID_STATES:
        response = batch_client.list_jobs(
            jobQueue=JQ,
            jobStatus=status
        )
        if response['jobSummaryList']: any_ = True
    if any_: return
    batch_client.submit_job(
        jobName='ml-up',
        jobQueue=JQ,
        jobDefinition=JD,
    )


def _ec2_down():
    try:
        ec2_client.stop_instances(InstanceIds=[EC2_ID])
    except: pass


def _batch_down():
    for status in VALID_STATES:
        response = batch_client.list_jobs(
            jobQueue=JQ,
            jobStatus=status
        )
        for x in response['jobSummaryList']:
            batch_client.terminate_job(
                jobId=x['jobId'],
                reason='user inactivity'
            )


def ec2_up():
    x = threading.Thread(target=_ec2_up, daemon=True)
    x.start()

def ec2_down():
    x = threading.Thread(target=_ec2_down, daemon=True)
    x.start()