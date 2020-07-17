import boto3
import threading
from jwtauthtest.database import engine

# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html
ec2_client = boto3.client('ec2')
EC2_ID = 'i-03e8ad4f3cadd4a4e'

def _ec2_up():
    try:
        ec2_client.start_instances(InstanceIds=[EC2_ID])
    except: pass


def _ec2_down():
    try:
        ec2_client.stop_instances(InstanceIds=[EC2_ID])
    except: pass


def ec2_up():
    x = threading.Thread(target=_ec2_up, daemon=True)
    x.start()

def ec2_down():
    x = threading.Thread(target=_ec2_down, daemon=True)
    x.start()