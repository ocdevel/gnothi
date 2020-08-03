FROM python
RUN apt-get update -y && apt-get install -y wget unzip

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
RUN apt-get install -y lsb-release &&\
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
  RELEASE=$(lsb_release -cs) &&\
  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
  apt update && apt -y install postgresql-client-12

RUN pip install spacy && python -m spacy download en_core_web_sm
RUN pip install nltk && python -m nltk.downloader punkt
RUN apt-get install -y default-jre &&\
    wget http://mallet.cs.umass.edu/dist/mallet-2.0.8.zip -O /mallet-2.0.8.zip && unzip /mallet-2.0.8.zip -d /

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
  beautifulsoup4 \
  markdown \
  python-box \
  lemminflect \
  mysqlclient \
  scipy \
  lxml \
  html5lib \
  langdetect \
  hyperopt \
  hdbscan \
  boto3 \
  kneed \
  keras \
  tensorflow \
  pynndescent \
  umap-learn \
  scikit-learn-extra \
  tqdm

# might need 'scipy==1.3.2' for jensen

COPY .aws /root/.aws
COPY . /app
WORKDIR /app

#scipy==1.3.2 because https://github.com/scipy/scipy/issues/11325

#EXPOSE 8080

#ENTRYPOINT ["gunicorn", "-b", ":8080", "main:app"]
