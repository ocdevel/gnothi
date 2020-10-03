FROM lefnire/dl:transformers-pt-tf-0.0.2

# TODO switch to mysql-python-connector & remove apt-get
RUN apt-get install -y default-libmysqlclient-dev

RUN \
  pip install --no-cache-dir spacy && python -m spacy download en_core_web_sm && \
  pip install --no-cache-dir \
  mysqlclient \
  psycopg2-binary \
  python-box \
  pandas \
  xgboost \
  sklearn \
  gensim \
  beautifulsoup4 \
  markdown \
  lemminflect \
  scipy \
  html5lib \
  #langdetect \
  hyperopt \
  kneed \
  #scikit-learn-extra \
  tqdm \
  sqlalchemy \
  feather-format \
  textacy \
  # For common/models TODO can remove some yet?
  fastapi-sqlalchemy \
  sqlalchemy_utils \
  cryptography \
  fastapi-users[sqlalchemy] \
  asyncpg \
  bcrypt \
  gradient \
  pytest \
  hnswlib \
  git+git://github.com/lefnire/lefnire_ml_utils.git \
  git+git://github.com/UKPLab/sentence-transformers.git@dc84bb7644946d8217fa2ea5211a75c53be89101

COPY ./gpu /paperspace
COPY ./common /paperspace/common

ENV ENVIRONMENT=production
ENV TORCH_HOME=/storage
ENV PYTHONPATH=.

WORKDIR /paperspace
ENTRYPOINT python app/run.py
# tf.test.gpu_device_name() to test
