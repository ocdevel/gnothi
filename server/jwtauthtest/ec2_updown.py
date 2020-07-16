import boto3

EC2_ID = 'i-03e8ad4f3cadd4a4e'
client = boto3.client('ec2')


def ec2_up():
    # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html#EC2.Client.start_instances
    response = client.start_instances(
        InstanceIds=[EC2_ID],
        # AdditionalInfo='string',
        # DryRun=True | False
    )


def ec2_down():
    # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ec2.html#EC2.Client.stop_instances
    response = client.stop_instances(
        InstanceIds=[EC2_ID],
        # Hibernate=True | False,
        # DryRun=True | False,
        # Force=True | False
    )
