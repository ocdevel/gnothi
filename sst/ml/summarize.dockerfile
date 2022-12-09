FROM public.ecr.aws/lambda/python:3.9

RUN pip3 install --no-cache-dir \
  # torch goes first to ensure CPU-only respected
  torch==1.13.0 --extra-index-url https://download.pytorch.org/whl/cpu \
  sentence-transformers==2.2.2 \
  keybert==0.7.0 \
  # transformers last to override version by others
  transformers==4.25.1

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY summarize ${LAMBDA_TASK_ROOT}/summarize
CMD [ "summarize/main.main" ]
