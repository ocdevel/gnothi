"""
TODO this should go away, we should be passing data to our Python Lambda via S3 or JSONL. Right now I'm connecting
to the DB to upgrade from Gnothi v0 quicker. But I don't want any DB access in the ML Lambdas; both for security,
maintainability, scalability - but also testability! We should be able to test these functions with direct test data
"""

import os
import json
import boto3
from urllib.parse import quote_plus
from sqlalchemy import create_engine

IS_LOCAL = os.environ.get('IS_LOCAL')
STAGE = os.environ["SST_STAGE"] # don't .get() it, force so we know if there's an issue here

def get_secret():
    secret_name = os.environ['DB_SECRET_ARN']
    region_name = os.environ['AWS_REGION']

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager', region_name=region_name)

    get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    secret = get_secret_value_response['SecretString']
    return json.loads(secret)

def get_connection_string():
    if IS_LOCAL:
        secret = {
            "username": "postgres",
            "password": "password",
            "host": "localhost",
            "dbname": f"gnothi{STAGE}",
            "port": 5432
        }
    else:
        secret = get_secret()
    username = secret['username']
    password = quote_plus(secret['password'])
    host = secret['host']
    dbname = secret['dbname']
    port = secret['port']

    print(f"Using gnothi{STAGE} DB")

    # Construct the connection string
    return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{dbname}"

engine = create_engine(get_connection_string())
