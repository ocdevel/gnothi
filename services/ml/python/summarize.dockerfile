FROM public.ecr.aws/lambda/python:3.9

RUN yum install -y wget
RUN pip3 install --no-cache-dir \
  ctransformers>=0.2.24

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY summarize ${LAMBDA_TASK_ROOT}/summarize
CMD [ "summarize/main.main" ]
