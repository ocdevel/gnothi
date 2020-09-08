#FROM pytorch/pytorch:1.6.0-cuda10.1-cudnn7-runtime

# TODO cleanup conda stuff via https://towardsdatascience.com/conda-pip-and-docker-ftw-d64fe638dc45
FROM nvidia/cuda:10.1-cudnn7-runtime-ubuntu18.04
RUN apt-get update -y &&\
 apt-get install -y --fix-missing wget unzip build-essential libpq-dev

# https://stackoverflow.com/a/58269633
#RUN rm -rf /var/lib/apt/lists/*
ENV PATH="/root/miniconda3/bin:${PATH}"
ARG PATH="/root/miniconda3/bin:${PATH}"
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh \
  && mkdir /root/.conda \
  && bash Miniconda3-latest-Linux-x86_64.sh -b \
  && rm -f Miniconda3-latest-Linux-x86_64.sh

# https://pythonspeed.com/articles/activate-conda-dockerfile/
#SHELL ["conda", "run", "-n", "py3", "/bin/bash", "-c"]

# https://github.com/ContinuumIO/docker-images/issues/89
SHELL ["/bin/bash", "--login", "-c"]
RUN \
  conda create -n py3 python=3.7 &&\
  #conda init bash &&\
  echo "source /opt/conda/etc/profile.d/conda.sh" &&\
  echo "source activate py3" >> $HOME/.bashrc

# Deep learning
RUN source activate py3 &&\
  pip install https://storage.googleapis.com/tensorflow/linux/gpu/tensorflow_gpu-2.3.0-cp37-cp37m-manylinux2010_x86_64.whl &&\
  pip install torch==1.6.0+cu101 torchvision==0.7.0+cu101 -f https://download.pytorch.org/whl/torch_stable.html
RUN source activate py3 &&\
  pip install transformers==3.0.2 sentence-transformers &&\
  transformers-cli download mrm8488/t5-base-finetuned-emotion &&\
  transformers-cli download facebook/bart-large-cnn &&\
  transformers-cli download allenai/longformer-large-4096-finetuned-triviaqa &&\
  python -c "from sentence_transformers import SentenceTransformer;SentenceTransformer('roberta-base-nli-stsb-mean-tokens')"

# Other NLP
RUN source activate py3 && pip install spacy && python -m spacy download en_core_web_sm
#RUN apt-get install -y default-jre &&\
#    wget http://mallet.cs.umass.edu/dist/mallet-2.0.8.zip -O /mallet-2.0.8.zip && unzip /mallet-2.0.8.zip -d /

# needed for mysql?
#RUN apt-get update -y && apt-get install -y default-libmysqlclient-dev

RUN source activate py3 && pip install \
  psycopg2-binary \
  python-box \
  pandas \
  xgboost \
  sklearn \
  gensim \
  beautifulsoup4 \
  markdown \
  lemminflect \
  mysql-connector-python \
  scipy \
  html5lib \
  #langdetect \
  hyperopt \
  kneed \
  keras \
  #scikit-learn-extra \
  tqdm \
  sqlalchemy \
  feather-format \
  textacy

# For common/models (unfortunately all/most required, find workaround later)
RUN source activate py3 && pip install \
  fastapi-sqlalchemy \
  sqlalchemy_utils \
  cryptography \
  fastapi-users[sqlalchemy] \
  asyncpg \
  bcrypt

COPY . /app
WORKDIR /app

ENTRYPOINT source activate py3 && python run.py
# tf.test.gpu_device_name() to test
