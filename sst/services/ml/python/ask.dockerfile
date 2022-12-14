FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    # torch goes first to ensure CPU-only respected
    torch==1.12 --extra-index-url https://download.pytorch.org/whl/cpu \
    farm-haystack==1.11.0 \
    sentence-transformers==2.2.2 \
    pandas==1.5.2 \
    pyarrow==10.0.1 \
    && pip3 install --no-cache-dir transformers==4.25.1

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY store ${LAMBDA_TASK_ROOT}/store
COPY ask ${LAMBDA_TASK_ROOT}/ask
CMD [ "ask/main.main" ]
