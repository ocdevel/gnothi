FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir --target=/tmp/pip \
    # torch goes first to ensure CPU-only respected
    torch==1.13 --extra-index-url https://download.pytorch.org/whl/cpu \
    pyarrow \
    sentence-transformers=2.2.2 \
COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY docstore ${LAMBDA_TASK_ROOT}/docstore
COPY books ${LAMBDA_TASK_ROOT}/books
CMD [ "books/main.main" ]
