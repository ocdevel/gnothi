FROM python

WORKDIR /app

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
RUN apt-get update &&\
  apt-get install -y lsb-release &&\
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
  RELEASE=$(lsb_release -cs) &&\
  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
  apt update && apt -y install postgresql-client-12

# Install transformers & run some init tasks to download files
RUN pip install spacy ftfy && python -m spacy download en
RUN pip install transformers &&\
  pip install torch==1.4.0+cpu torchvision==0.5.0+cpu -f https://download.pytorch.org/whl/torch_stable.html &&\
  python -c "from transformers import pipeline;pipeline('summarization');pipeline('sentiment-analysis');pipeline('question-answering')"

RUN apt-get install -y htop unzip wget default-jre

RUN wget http://mallet.cs.umass.edu/dist/mallet-2.0.8.zip && unzip mallet-2.0.8.zip && rm mallet-2.0.8.zip

RUN pip install \
  flask \
  flask-cors \
  flask-jwt \
  flask-sqlalchemy \
  passlib \
  psycopg2 \
  python-box \
  sqlalchemy_utils \
  pandas \
  requests \
  xgboost \
  sklearn \
  flask-apscheduler \
  gensim \
  nltk \
  beautifulsoup4 \
  markdown \
  python-box \
  lemminflect

#EXPOSE 8080

#ENTRYPOINT ["gunicorn", "-b", ":8080", "main:app"]
