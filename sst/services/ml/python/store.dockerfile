FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    # torch goes first to ensure CPU-only respected
    torch==1.13 --extra-index-url https://download.pytorch.org/whl/cpu \
    sentence-transformers==2.2.2 \
    pandas==1.5.2 \
    pyarrow==10.0.1 \
    # cleantext
    markdown2==2.4.6 \
    python-box==6.1.0 \
    markdownify==0.11.6 \
    html5lib===1.1 \
    clean-text==0.6.0 \
    unidecode==1.3.6 \
    # force-install preferred huggingface, lots of trouble with haystack's 4.22.1
    && pip3 install --no-cache-dir --target=/tmp/pip transformers==4.25.1

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY store ${LAMBDA_TASK_ROOT}/store
CMD [ "store/main.main" ]


