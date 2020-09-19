FROM lefnire/dl:transformers-pt-tf

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
  gradient

COPY ./gpu /paperspace
COPY ./common /paperspace/common

ENV ENVIRONMENT=production
ENV TORCH_HOME=/storage

WORKDIR /paperspace
ENTRYPOINT python run.py
# tf.test.gpu_device_name() to test
