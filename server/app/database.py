import os
import boto3
import logging
import json
from sqlalchemy import create_engine


logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_client = boto3.client("secretsmanager")
secrets = secrets_client.get_secret_value(SecretId=os.environ['secret_id'])
secrets = json.loads(secrets['SecretString'])
logger.info(secrets)

username = secrets['username']
password = secrets['password']
endpoint = os.environ['endpoint']
database = os.environ['database']

conn_str = f"postgresql+psycopg2://{username}:{password}@{endpoint}:5432/{database}"
logger.info(conn_str)
engine = create_engine(conn_str)

engine.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

logger.info(engine.execute("select 1").fetchone())
