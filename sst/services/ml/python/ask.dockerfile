FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    # torch goes first to ensure CPU-only respected
    torch==1.12 --extra-index-url https://download.pytorch.org/whl/cpu \
    sentence-transformers==2.2.2 \
    pandas==1.5.2 \
    pyarrow==12.0.0 \
    && pip3 install --no-cache-dir transformers==4.29.0

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY store ${LAMBDA_TASK_ROOT}/store
COPY ask ${LAMBDA_TASK_ROOT}/ask
CMD [ "ask/main.main" ]
