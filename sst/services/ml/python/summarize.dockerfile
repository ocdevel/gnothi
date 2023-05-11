FROM public.ecr.aws/lambda/python:3.9

RUN pip3 install --no-cache-dir \
  # torch goes first to ensure CPU-only respected
  torch==1.13.1 --extra-index-url https://download.pytorch.org/whl/cpu \
  sentence-transformers==2.2.2 \
  keybert==0.7.0 \
  # textsum==0.1.5 \
  # force-install preferred version
  && pip3 install --no-cache-dir transformers==4.29.0

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY summarize ${LAMBDA_TASK_ROOT}/summarize
CMD [ "summarize/main.main" ]
