FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    markdown2==2.4.6 \
    python-box==6.1.0 \
    markdownify==0.11.6 \
    html5lib===1.1 \
    clean-text==0.6.0 \
    unidecode==1.3.6

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY preprocess ${LAMBDA_TASK_ROOT}/preprocess
CMD [ "preprocess/main.main" ]


