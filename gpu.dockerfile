FROM python:3.8

# TODO switch to mysql-python-connector & remove apt-get
RUN apt-get update -y && \
  apt-get install -y wget bzip2 ca-certificates curl git unzip build-essential gcc && \
  apt-get install -y default-libmysqlclient-dev && \
  rm -rf /var/lib/apt/lists

RUN pip install --no-cache-dir https://storage.googleapis.com/tensorflow/linux/cpu/tensorflow_cpu-2.4.0-cp38-cp38-manylinux2010_x86_64.whl
RUN pip install --no-cache-dir install torch==1.8.1+cpu torchvision==0.9.1+cpu torchaudio==0.8.1 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install --no-cache-dir transformers sentence-transformers

# ML
RUN pip install --no-cache-dir \
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
  gensim

RUN pip install --no-cache-dir \
  mysqlclient \
  psycopg2-binary \
  #langdetect \
  #scikit-learn-extra \
  sqlalchemy==1.3.24 \
  sqlalchemy_utils \
  feather-format \
  # For common/models TODO can remove some yet?
  fastapi-utils \
  cryptography \
  asyncpg \
  bcrypt \
  boto3 \
  dynaconf \
  pytest \
  git+git://github.com/lefnire/ml-tools.git@9316d42c \
  petname \
  orjson \
  shortuuid

RUN pip install --no-cache-dir\
  sympy onnxruntime onnxruntime-tools onnx \
  psutil jupyter matplotlib

#COPY ./gpu /paperspace
#COPY ./common /paperspace/common

ENV ENVIRONMENT=development
ENV TORCH_HOME=/storage/transformers
ENV TRANSFORMERS_CACHE=/storage/transformers
ENV STANZA_RESOURCES_DIR=/storage/stanza_resources
ENV PYTHONPATH=.

# TODO move this to /storage setup
RUN python -m spacy download en_core_web_sm

WORKDIR /paperspace
ENTRYPOINT python app/run.py
# tf.test.gpu_device_name() to test
