FROM public.ecr.aws/lambda/python:3.9

RUN pip3 install --no-cache-dir \
  transformers[torch]==4.29.0

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY summarize ${LAMBDA_TASK_ROOT}/summarize
CMD [ "summarize/main.main" ]
