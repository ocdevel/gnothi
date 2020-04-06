FROM python

RUN pip install \
  flask \
  flask-cors \
  flask-jwt \
  flask-sqlalchemy \
  passlib \
  psycopg2 \
  python-box \
  sqlalchemy_utils \
  pandas

# Install postgres-12 client
# https://computingforgeeks.com/install-postgresql-11-on-ubuntu-18-04-ubuntu-16-04/
RUN apt-get update &&\
  apt-get install -y lsb-release &&\
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - &&\
  RELEASE=$(lsb_release -cs) &&\
  echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list &&\
  apt update && apt -y install postgresql-client-12

WORKDIR /app

#EXPOSE 8080

#ENTRYPOINT ["gunicorn", "-b", ":8080", "main:app"]
