FROM lefnire/ml-tools:ml-tools-0.0.9

# TODO switch to mysql-python-connector & remove apt-get
RUN apt-get update -y && \
  apt-get install -y default-libmysqlclient-dev && \
  rm -rf /var/lib/apt/lists

RUN \
  pip install --no-cache-dir \
  mysqlclient \
  psycopg2-binary \
  #langdetect \
  #scikit-learn-extra \
  sqlalchemy \
  feather-format \
  # For common/models TODO can remove some yet?
  fastapi-sqlalchemy \
  sqlalchemy_utils \
  cryptography \
  fastapi-users[sqlalchemy] \
  asyncpg \
  bcrypt \
  gradient \
  pytest \
  git+git://github.com/lefnire/ml-tools.git@0.0.9

COPY ./gpu /paperspace
COPY ./common /paperspace/common

ENV ENVIRONMENT=production
ENV TORCH_HOME=/storage
ENV STANZA_RESOURCES_DIR=/storage/stanza_resources
ENV PYTHONPATH=.

WORKDIR /paperspace
ENTRYPOINT python app/run.py
# tf.test.gpu_device_name() to test
