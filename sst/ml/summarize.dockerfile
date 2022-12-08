FROM public.ecr.aws/lambda/python:3.9
COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY summarize ${LAMBDA_TASK_ROOT}/summarize
RUN pip3 install --no-cache-dir -r summarize/requirements.txt
#  && pip3 install --no-cache-dir -r summarize/requirements.txt
CMD [ "summarize/main.main" ]
