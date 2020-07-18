FROM tensorflow/tensorflow:2.2.0-gpu
RUN apt-get update -y && apt-get install -y wget unzip

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
RUN apt-get install -y lsb-release &&\
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
  RELEASE=$(lsb_release -cs) &&\
  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
  apt update && apt -y install postgresql-client-12

RUN pip install torch==1.5.1+cu101 torchvision==0.6.1+cu101 -f https://download.pytorch.org/whl/torch_stable.html

RUN pip install \
    psycopg2-binary \
    python-box \
    sqlalchemy \
    sentence-transformers==0.2.6 \
    transformers==2.11.0

COPY . /app
WORKDIR /app

RUN python install_models.py

#ENTRYPOINT /bin/bash
ENTRYPOINT python windows.py
# tf.test.gpu_device_name() to test