FROM public.ecr.aws/lambda/python:3.9
COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY docstore ${LAMBDA_TASK_ROOT}/docstore
RUN pip3 install --no-cache-dir -r common/requirements.txt \
  && pip3 install --no-cache-dir -r docstore/requirements.txt
CMD [ "docstore/main.main" ]
