FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
  xgboost==1.7.5 \
  optuna==3.2.0 \
  psycopg2-binary==2.9.5 \
  sqlalchemy==1.4.44 \
  pandas==1.5.2 \
  scikit-learn==1.1.3

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY behaviors ${LAMBDA_TASK_ROOT}/behaviors
# This will change to main.main once we add more behaviors stuff, like TableGPT
CMD [ "behaviors/influencers.main" ]


