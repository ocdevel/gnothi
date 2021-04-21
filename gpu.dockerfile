FROM huggingface/transformers-gpu:4.5.1

RUN \
  pip install --no-cache-dir \
  # misc
  python-box \
  tqdm \
  pytest \
  # ML
  pandas \
  xgboost \
  sklearn \
  scipy \
  optuna \
  kneed \
  # CleanText
  beautifulsoup4 \
  markdown2 \
  markdownify \
  html5lib \
  textacy \
  # NLP
  spacy \
  spacy-stanza \
  lemminflect \
  gensim \
  sentence-transformers

# TODO move this to /storage setup
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
RUN python3 -m spacy download en_core_web_sm

RUN apt-get update -y && apt-get install -y \
    wget bzip2 ca-certificates curl git unzip build-essential gcc \
    default-libmysqlclient-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists

RUN pip install --no-cache-dir \
  mysqlclient \
  psycopg2-binary \
  #langdetect \
  #scikit-learn-extra \
  sqlalchemy==1.3.24 \
  feather-format \
  # For common/models TODO can remove some yet?
  #fastapi \
  sqlalchemy_utils \
  cryptography \
  asyncpg \
  bcrypt \
  boto3 \
  dynaconf \
  git+git://github.com/lefnire/ml-tools.git@9316d42c \
  petname \
  fastapi-utils \
  orjson \
  shortuuid

#COPY ./gpu /paperspace
#COPY ./common /paperspace/common

ENV ENVIRONMENT=production
ENV TORCH_HOME=/storage/transformers
ENV TRANSFORMERS_CACHE=/storage/transformers
ENV STANZA_RESOURCES_DIR=/storage/stanza_resources
ENV PYTHONPATH=.

WORKDIR /paperspace
ENTRYPOINT python app/run.py
# tf.test.gpu_device_name() to test
