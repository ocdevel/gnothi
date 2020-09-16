FROM nvidia/cuda:10.1-cudnn7-runtime-ubuntu18.04
RUN apt-get update -y &&\
 apt-get install -y --fix-missing wget unzip build-essential

# install miniconda https://towardsdatascience.com/conda-pip-and-docker-ftw-d64fe638dc45
# other options:
# * https://pythonspeed.com/articles/activate-conda-dockerfile/
# * https://github.com/ContinuumIO/docker-images/issues/89
# * https://stackoverflow.com/a/58269633
SHELL ["/bin/bash", "--login", "-c"]
ENV CONDA_DIR $HOME/miniconda3
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    chmod +x ~/miniconda.sh && \
    ~/miniconda.sh -b -p $CONDA_DIR && \
    rm ~/miniconda.sh
# make non-activate conda commands available
ENV PATH=$CONDA_DIR/bin:$PATH
# make conda activate command available from /bin/bash --login shells
RUN echo ". $CONDA_DIR/etc/profile.d/conda.sh" >> ~/.profile
# make conda activate command available from /bin/bash --interative shells
RUN conda init bash


# Deep learning
RUN \
  pip install https://storage.googleapis.com/tensorflow/linux/gpu/tensorflow_gpu-2.3.0-cp38-cp38-manylinux2010_x86_64.whl &&\
  pip install torch==1.6.0+cu101 torchvision==0.7.0+cu101 -f https://download.pytorch.org/whl/torch_stable.html

RUN pip install spacy[cuda101] && python -m spacy download en_core_web_sm

RUN apt-get install -y default-libmysqlclient-dev
RUN pip install \
  transformers==3.1.0 \
  sentence-transformers==0.3.6 \
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
  #langdetect \
  hyperopt \
  kneed \
  #scikit-learn-extra \
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

ENTRYPOINT python run.py
# tf.test.gpu_device_name() to test
