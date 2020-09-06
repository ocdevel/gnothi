FROM pytorch/pytorch:1.6.0-cuda10.1-cudnn7-runtime
RUN apt-get update -y && apt-get install -y wget unzip

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
#RUN apt-get install -y lsb-release &&\
#  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
#  RELEASE=$(lsb_release -cs) &&\
#  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
#  apt update && apt -y install postgresql-client-12

RUN pip install tensorflow keras
RUN pip install spacy && python -m spacy download en_core_web_sm
#RUN apt-get install -y default-jre &&\
#    wget http://mallet.cs.umass.edu/dist/mallet-2.0.8.zip -O /mallet-2.0.8.zip && unzip /mallet-2.0.8.zip -d /

RUN pip install transformers==3.0.2 sentence-transformers &&\
    transformers-cli download mrm8488/t5-base-finetuned-emotion &&\
    transformers-cli download facebook/bart-large-cnn &&\
    transformers-cli download allenai/longformer-large-4096-finetuned-triviaqa &&\
    python -c "from sentence_transformers import SentenceTransformer;SentenceTransformer('roberta-base-nli-stsb-mean-tokens')"

# needed for mysql?
RUN apt-get install -y --fix-missing default-libmysqlclient-dev

# needed for pytorch docker, not tensorflow
RUN apt-get install -y build-essential

RUN pip install \
    psycopg2-binary \
    python-box \
    pandas \
    xgboost \
    sklearn \
    gensim \
    beautifulsoup4 \
    markdown \
    lemminflect \
    mysqlclient \
    scipy \
    html5lib \
    langdetect \
    hyperopt \
    kneed \
    keras \
    scikit-learn-extra \
    tqdm \
    sqlalchemy \
    feather-format \
    textacy

# For common/models (unfortunately all/most required, find workaround later)
RUN pip install \
  fastapi-sqlalchemy \
  sqlalchemy_utils \
  cryptography \
  fastapi-users[sqlalchemy] \
  asyncpg \
  bcrypt

COPY . /app
WORKDIR /app

#ENTRYPOINT /bin/bash
ENTRYPOINT python run.py
# tf.test.gpu_device_name() to test
