FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    # torch goes first to ensure CPU-only respected
    torch==1.13 --extra-index-url https://download.pytorch.org/whl/cpu \
    pandas==1.5.2 \
    pyarrow==12.0.0 \
    sentence-transformers==2.2.2

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY books ${LAMBDA_TASK_ROOT}/books
CMD [ "books/main.main" ]
