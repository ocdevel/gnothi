import os
import boto3
import logging
import json
from pydantic import BaseSettings

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Settings(BaseSettings):
    db_user: str = ""
    db_pass: str = ""
    db_endpoint: str = ""
    db_name: str = ""
    db_port: str = "5432"
    environment: str = "development"

    # # ?charset part is super important here
    db_books: str = "mysql://user:password@localhost:3306/libgen?charset=utf8mb4"
    #
    flask_key: str = "x"
    machine: str = "desktop"
    habit_user: str = "x"
    habbit_app: str = "x"
    # api token only needed for tests
    habit_api: str = "x"

    email_ses_email_source: str = "x"

    ga: str = "x"

    stripe_publishable_key: str = "x"
    strip_secret_key: str = "x"
    strip_api_version: str = "2020-08-27"
    stripe_webhook_secret: str = "x"

    ae_path: str = "x"


settings = Settings()

settings.ae_path = f"/storage/libgen/{settings.environment}_all.tf"

secrets_client = boto3.client("secretsmanager")
secrets = secrets_client.get_secret_value(SecretId=os.environ['secret_id'])
secrets = json.loads(secrets['SecretString'])

settings.db_user = secrets['username']
settings.db_pass = secrets['password']
settings.db_endpoint = os.environ['db_endpoint']
settings.db_name = os.environ['db_name']
settings.db_port = os.environ['db_port']

is_prod = settings.environment == "production"
is_dev = settings.environment == "development"
is_test = settings.environment == "testing"
