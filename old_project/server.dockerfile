FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

RUN apt-get update -y &&\
  curl -s https://raw.githubusercontent.com/lefnire/ml-tools/master/dockerfiles/psql-client.sh | bash

RUN pip install \
  sqlalchemy==1.3.23 \
  python-multipart \
  psycopg2-binary \
  sqlalchemy_utils \
  pandas \
  requests \
  apscheduler \
  markdown \
  python-box \
  tqdm \
  cryptography \
  # else fastapi-jwt-auth breaks
  passlib \
  fastapi-jwt-auth \
  PyJWT==1.7.1 \
  asyncpg \
  bcrypt \
  shortuuid \
  pytest \
  pytest-timeout \
  lorem-text \
  boto3 \
  dynaconf \
  stripe \
  petname \
  fastapi-utils \
  orjson \
  python-jose \
  broadcaster[postgres] \
  alembic \
  aioify \
  slowapi

COPY ./server/app /app/app
COPY ./common /app/common
WORKDIR /app

EXPOSE 80
EXPOSE 443
