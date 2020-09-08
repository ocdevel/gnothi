FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8
RUN apt-get update -y && apt-get install -y wget unzip

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
RUN apt-get install -y lsb-release &&\
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
  RELEASE=$(lsb_release -cs) &&\
  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
  apt update && apt -y install postgresql-client-12

RUN pip install \
  python-multipart \
  fastapi-sqlalchemy \
  psycopg2-binary \
  sqlalchemy_utils \
  pandas \
  requests \
  flask-apscheduler \
  markdown \
  python-box \
  boto3 \
  tqdm \
  mysql-connector-python \
  cryptography \
  fastapi-users[sqlalchemy] \
  asyncpg \
  bcrypt \
  passlib \
  shortuuid \
  pytest \
  lorem-text

COPY .aws /root/.aws
COPY app /app
WORKDIR /app

EXPOSE 80
EXPOSE 443
