FROM python:3.9
#FROM public.ecr.aws/lambda/python:3.9

RUN pip3 install --no-cache-dir \
  #python-multipart==0.0.5 \
  fastapi-sqlalchemy==0.1.3 \
  psycopg2-binary==2.8.6 \
  sqlalchemy_utils==0.36.8 \
  pandas==1.1.4 \
  requests==2.25.0 \
  #apscheduler==3.6.3 \
  #markdown==3.3.3 \
  python-box==5.2.0 \
  tqdm==4.54.0 \
  #mysqlclient==2.0.1 \
  cryptography==3.2.1 \
  PyJWT==1.7.1 \
  fastapi-users[sqlalchemy]==3.1.1 \
  fastapi-jwt-auth==0.3.0 \
  asyncpg==0.21.0 \
  bcrypt==3.2.0 \
  #shortuuid==1.0.1 \
  #pytest==6.1.2 \
  #pytest-timeout==1.4.2 \
  #lorem-text==1.3 \
  boto3==1.16.25 \
  #stripe==2.55.0 \
  dynaconf==3.1.2


#COPY . ${LAMBDA_TASK_ROOT}
COPY . /app
CMD [ "migrate.main" ]

