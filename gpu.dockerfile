# Huggingface
# https://github.com/huggingface/transformers/blob/master/docker/transformers-pytorch-gpu/Dockerfile
FROM nvidia/cuda:10.2-cudnn7-runtime-ubuntu18.04

# Python3.8 via Miniconda https://hub.docker.com/r/continuumio/miniconda3/dockerfile
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH /opt/conda/bin:$PATH

RUN apt-get update -y && \
    apt-get install -y \
    # Huggingface / other
    bash ca-certificates curl git build-essential \
    # Gnothi
    gcc unzip wget bzip2 default-libmysqlclient-dev && \
    rm -rf /var/lib/apt/lists

# Python 3.8
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc
#SHELL ["/bin/bash", "--login", "-c"]
CMD ["/bin/bash"]

RUN conda install pytorch cudatoolkit=10.2 -c pytorch
# e958bc4b NVIDIA/apex

RUN pip install --no-cache-dir transformers==4.5.1 sentence-transformers==1.1.0
# /Huggingface

RUN pip install --no-cache-dir \
  # Misc
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
  gensim

# TODO move this to /storage setup
RUN conda install -c conda-forge spacy && \
  conda install -c conda-forge cupy && \
  pip install lemminflect textacy && \
  python -m spacy download en_core_web_sm

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
  git+git://github.com/lefnire/ml-tools.git@1e7c00da \
  petname \
  fastapi-utils \
  orjson \
  shortuuid

#COPY ./gpu /paperspace
#COPY ./common /paperspace/common

ENV ENVIRONMENT=production
ENV TORCH_HOME=/storage/transformers
ENV TRANSFORMERS_CACHE=/storage/transformers
ENV PYTHONPATH=.

WORKDIR /paperspace
ENTRYPOINT python app/run.py
# tf.test.gpu_device_name() to test
